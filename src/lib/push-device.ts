import {
  registerPushToken,
  unregisterPushToken,
} from "@/lib/client/notifications";
import {
  currentPushToken,
  forgetPushToken,
  pushPermission,
  pushSupported,
} from "@/lib/firebase/messaging";

/** Registers this browser for push when the user has already allowed notifications. */
export async function syncPushDevice() {
  if (pushPermission() !== "granted" || !(await pushSupported())) return;
  await registerPushToken(await currentPushToken());
}

/** Signing out stops pushes to this browser; it runs before the Firebase sign-out it needs. */
export async function unregisterPushDevice() {
  if (pushPermission() !== "granted" || !(await pushSupported())) return;
  const token = await currentPushToken();
  await unregisterPushToken(token);
  await forgetPushToken();
}
