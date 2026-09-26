"use client";

import { useCallback, useEffect, useState } from "react";

import { registerPushToken } from "@/lib/client/notifications";
import { syncPushDevice } from "@/lib/push-device";
import {
  currentPushToken,
  needsHomeScreenInstall,
  pushPermission,
  pushSupported,
  requestPushPermission,
} from "@/lib/firebase/messaging";

export enum PushDeviceState {
  Checking = "checking",
  Unsupported = "unsupported",
  NeedsInstall = "needs-install",
  Off = "off",
  On = "on",
  Blocked = "blocked",
}

function stateFor(permission: NotificationPermission) {
  if (permission === "granted") return PushDeviceState.On;
  if (permission === "denied") return PushDeviceState.Blocked;
  return PushDeviceState.Off;
}

async function detectState() {
  if (needsHomeScreenInstall()) return PushDeviceState.NeedsInstall;
  if (!(await pushSupported())) return PushDeviceState.Unsupported;
  return stateFor(pushPermission());
}

/** Whether this browser gets push notifications, and turning them on. */
export function usePushDevice() {
  const [state, setState] = useState(PushDeviceState.Checking);
  const [isEnabling, setIsEnabling] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void detectState().then((detected) => {
      if (active) setState(detected);
    });
    return () => {
      active = false;
    };
  }, []);

  const enable = useCallback(async () => {
    setIsEnabling(true);
    setFailed(false);
    try {
      const permission = await requestPushPermission();
      if (permission === "granted") {
        await registerPushToken(await currentPushToken());
      }
      setState(stateFor(permission));
    } catch {
      setFailed(true);
    } finally {
      setIsEnabling(false);
    }
  }, []);

  return { state, enable, isEnabling, failed };
}

/** Keeps an already allowed browser registered for the signed-in user; failures stay silent. */
export function usePushSync(userId: string | null) {
  useEffect(() => {
    if (userId) void syncPushDevice().catch(() => undefined);
  }, [userId]);
}
