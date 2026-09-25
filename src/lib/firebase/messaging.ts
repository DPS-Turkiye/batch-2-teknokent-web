import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import { firebaseApp, isFirebaseConfigured } from "@/lib/firebase/client";

export const PUSH_SERVICE_WORKER_URL = "/push-sw.js";

function vapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
}

/** iOS only delivers web push to the app once it is added to the home screen. */
export function needsHomeScreenInstall() {
  if (typeof window === "undefined") return false;
  const ios = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  return ios && !standalone;
}

export async function pushSupported() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !isFirebaseConfigured() ||
    !vapidKey()
  ) {
    return false;
  }
  return isSupported().catch(() => false);
}

export function pushPermission(): NotificationPermission {
  return typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "denied";
}

export async function requestPushPermission() {
  return Notification.requestPermission();
}

/** The browser's push token, registering the service worker on first use. */
export async function currentPushToken() {
  const registration = await navigator.serviceWorker.register(
    PUSH_SERVICE_WORKER_URL,
  );
  return getToken(getMessaging(firebaseApp()), {
    vapidKey: vapidKey(),
    serviceWorkerRegistration: registration,
  });
}

export async function forgetPushToken() {
  await deleteToken(getMessaging(firebaseApp()));
}
