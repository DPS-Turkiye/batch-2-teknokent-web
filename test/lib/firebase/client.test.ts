import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  firebaseApp,
  firebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/client";

vi.mock("firebase/app", () => ({
  getApp: vi.fn(),
  getApps: vi.fn(),
  initializeApp: vi.fn(),
}));
vi.mock("firebase/auth", () => ({ getAuth: vi.fn() }));

function app(name: string): FirebaseApp {
  return {
    name,
    options: {},
    automaticDataCollectionEnabled: false,
  };
}

function configure() {
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "api-key");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "menton.firebaseapp.com");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "menton");
}

describe("Firebase client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApps).mockReturnValue([]);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts the app under its own name from the public settings", () => {
    configure();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "app-id");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "sender-id");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "bucket");
    const started = app("metual-auth");
    vi.mocked(initializeApp).mockReturnValue(started);

    expect(firebaseApp()).toBe(started);
    expect(initializeApp).toHaveBeenCalledWith(
      {
        apiKey: "api-key",
        authDomain: "menton.firebaseapp.com",
        projectId: "menton",
        appId: "app-id",
        messagingSenderId: "sender-id",
        storageBucket: "bucket",
      },
      "metual-auth",
    );
  });

  it("reuses the app once it is started instead of starting a second one", () => {
    const existing = app("metual-auth");
    vi.mocked(getApps).mockReturnValue([app("[DEFAULT]"), existing]);
    vi.mocked(getApp).mockReturnValue(existing);

    expect(firebaseApp()).toBe(existing);
    expect(getApp).toHaveBeenCalledWith("metual-auth");
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("refuses to start without the required settings", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "api-key");

    expect(() => firebaseApp()).toThrow(
      "Firebase bağlantı ayarları yapılandırılmalıdır.",
    );
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("reads the auth of its own app", () => {
    configure();
    const started = app("metual-auth");
    vi.mocked(initializeApp).mockReturnValue(started);

    firebaseAuth();

    expect(getAuth).toHaveBeenCalledWith(started);
  });

  it("is configured only when the key, domain and project are all set", () => {
    expect(isFirebaseConfigured()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "api-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "menton.firebaseapp.com");
    expect(isFirebaseConfigured()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "menton");
    expect(isFirebaseConfigured()).toBe(true);
  });
});
