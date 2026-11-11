import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { firebaseApp, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  currentPushToken,
  forgetPushToken,
  needsHomeScreenInstall,
  PUSH_SERVICE_WORKER_URL,
  pushPermission,
  pushSupported,
  requestPushPermission,
} from "@/lib/firebase/messaging";

// Held by name rather than imported: the source still calls Firebase's deprecated token API, and
// importing it here as well would only repeat that warning.
const sdk = vi.hoisted(() => ({
  deleteToken: vi.fn(),
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  isSupported: vi.fn(),
}));

vi.mock("firebase/messaging", () => sdk);
vi.mock("@/lib/firebase/client", () => ({
  firebaseApp: vi.fn(),
  isFirebaseConfigured: vi.fn(),
}));

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

const app: FirebaseApp = {
  name: "metual-auth",
  options: {},
  automaticDataCollectionEnabled: false,
};
const messaging: Messaging = { app };

class FakeNotification {
  static permission: NotificationPermission = "granted";
  static requestPermission = vi.fn(
    async (): Promise<NotificationPermission> => "granted",
  );
}

function setUserAgent(userAgent: string) {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(userAgent);
}

function setStandalone(standalone: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: standalone && query === "(display-mode: standalone)",
    })),
  );
}

const registration = { scope: "/" };
const serviceWorker = { register: vi.fn(async () => registration) };

function withServiceWorker() {
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: serviceWorker,
  });
}

function withNotifications() {
  vi.stubGlobal("Notification", FakeNotification);
}

describe("web push", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseApp).mockReturnValue(app);
    sdk.getMessaging.mockReturnValue(messaging);
    vi.mocked(isFirebaseConfigured).mockReturnValue(true);
    sdk.isSupported.mockResolvedValue(true);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "vapid-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    Reflect.deleteProperty(window.navigator, "serviceWorker");
  });

  describe("needsHomeScreenInstall", () => {
    it("asks an iPhone in Safari to add the app to the home screen", () => {
      setUserAgent(IPHONE);
      setStandalone(false);

      expect(needsHomeScreenInstall()).toBe(true);
    });

    it("does not ask an iPhone that already runs the installed app", () => {
      setUserAgent(IPHONE);
      setStandalone(true);

      expect(needsHomeScreenInstall()).toBe(false);
    });

    it("does not ask an iPhone that reports standalone on the navigator", () => {
      setUserAgent(IPHONE);
      setStandalone(false);
      Object.defineProperty(window.navigator, "standalone", {
        configurable: true,
        value: true,
      });

      try {
        expect(needsHomeScreenInstall()).toBe(false);
      } finally {
        Reflect.deleteProperty(window.navigator, "standalone");
      }
    });

    it("never asks a desktop browser", () => {
      setUserAgent(DESKTOP);
      setStandalone(false);

      expect(needsHomeScreenInstall()).toBe(false);
    });
  });

  describe("pushSupported", () => {
    it("is supported when the browser, Firebase and the VAPID key are all ready", async () => {
      withNotifications();
      withServiceWorker();

      await expect(pushSupported()).resolves.toBe(true);
    });

    it("is unsupported in a browser without notifications", async () => {
      withServiceWorker();

      await expect(pushSupported()).resolves.toBe(false);
      expect(sdk.isSupported).not.toHaveBeenCalled();
    });

    it("is unsupported in a browser without service workers", async () => {
      withNotifications();

      await expect(pushSupported()).resolves.toBe(false);
    });

    it("is unsupported when Firebase is not configured", async () => {
      withNotifications();
      withServiceWorker();
      vi.mocked(isFirebaseConfigured).mockReturnValue(false);

      await expect(pushSupported()).resolves.toBe(false);
    });

    it("is unsupported without a VAPID key", async () => {
      withNotifications();
      withServiceWorker();
      vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "");

      await expect(pushSupported()).resolves.toBe(false);
    });

    it("is unsupported instead of rejecting when Firebase's own check fails", async () => {
      withNotifications();
      withServiceWorker();
      sdk.isSupported.mockRejectedValue(new Error("indexedDB blocked"));

      await expect(pushSupported()).resolves.toBe(false);
    });
  });

  describe("pushPermission", () => {
    it("reads the browser's notification permission", () => {
      withNotifications();
      FakeNotification.permission = "default";

      expect(pushPermission()).toBe("default");
    });

    it("counts a browser without notifications as denied", () => {
      expect(pushPermission()).toBe("denied");
    });
  });

  it("requestPushPermission asks the browser and answers its choice", async () => {
    withNotifications();
    FakeNotification.requestPermission.mockResolvedValue("denied");

    await expect(requestPushPermission()).resolves.toBe("denied");
  });

  it("currentPushToken registers the push worker and asks Firebase for its token", async () => {
    withServiceWorker();
    sdk.getToken.mockResolvedValue("fcm-token");

    await expect(currentPushToken()).resolves.toBe("fcm-token");

    expect(serviceWorker.register).toHaveBeenCalledWith(
      PUSH_SERVICE_WORKER_URL,
    );
    expect(sdk.getMessaging).toHaveBeenCalledWith(app);
    expect(sdk.getToken).toHaveBeenCalledWith(messaging, {
      vapidKey: "vapid-key",
      serviceWorkerRegistration: registration,
    });
  });

  it("forgetPushToken deletes the browser's token from Firebase", async () => {
    await forgetPushToken();

    expect(sdk.deleteToken).toHaveBeenCalledWith(messaging);
  });
});
