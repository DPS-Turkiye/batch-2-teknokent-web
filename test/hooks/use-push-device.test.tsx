import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PushDeviceState, usePushDevice } from "@/hooks/use-push-device";
import { registerPushToken } from "@/lib/client/notifications";
import {
  currentPushToken,
  needsHomeScreenInstall,
  pushPermission,
  pushSupported,
  requestPushPermission,
} from "@/lib/firebase/messaging";

vi.mock("@/lib/client/notifications", () => ({
  registerPushToken: vi.fn(),
}));
vi.mock("@/lib/push-device", () => ({ syncPushDevice: vi.fn() }));
vi.mock("@/lib/firebase/messaging", () => ({
  currentPushToken: vi.fn(),
  needsHomeScreenInstall: vi.fn(),
  pushPermission: vi.fn(),
  pushSupported: vi.fn(),
  requestPushPermission: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(needsHomeScreenInstall).mockReturnValue(false);
  vi.mocked(pushSupported).mockResolvedValue(true);
  vi.mocked(pushPermission).mockReturnValue("default");
  vi.mocked(currentPushToken).mockResolvedValue("fcm-token");
});

describe("usePushDevice", () => {
  it("asks for permission and registers the browser when turned on", async () => {
    vi.mocked(requestPushPermission).mockResolvedValue("granted");
    const { result } = renderHook(() => usePushDevice());
    await waitFor(() => expect(result.current.state).toBe(PushDeviceState.Off));

    await act(() => result.current.enable());

    expect(registerPushToken).toHaveBeenCalledWith("fcm-token");
    expect(result.current.state).toBe(PushDeviceState.On);
  });

  it("reports a refusal as blocked without registering", async () => {
    vi.mocked(requestPushPermission).mockResolvedValue("denied");
    const { result } = renderHook(() => usePushDevice());
    await waitFor(() => expect(result.current.state).toBe(PushDeviceState.Off));

    await act(() => result.current.enable());

    expect(registerPushToken).not.toHaveBeenCalled();
    expect(result.current.state).toBe(PushDeviceState.Blocked);
  });

  it("flags a failed registration so the user can retry", async () => {
    vi.mocked(requestPushPermission).mockResolvedValue("granted");
    vi.mocked(registerPushToken).mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => usePushDevice());
    await waitFor(() => expect(result.current.state).toBe(PushDeviceState.Off));

    await act(() => result.current.enable());

    expect(result.current.failed).toBe(true);
  });

  it("asks iPhone users to add the app to the home screen first", async () => {
    vi.mocked(needsHomeScreenInstall).mockReturnValue(true);
    const { result } = renderHook(() => usePushDevice());

    await waitFor(() =>
      expect(result.current.state).toBe(PushDeviceState.NeedsInstall),
    );
  });

  it("says so when the browser has no push", async () => {
    vi.mocked(pushSupported).mockResolvedValue(false);
    const { result } = renderHook(() => usePushDevice());

    await waitFor(() =>
      expect(result.current.state).toBe(PushDeviceState.Unsupported),
    );
  });
});
