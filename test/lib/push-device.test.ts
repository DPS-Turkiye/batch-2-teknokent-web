import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { syncPushDevice, unregisterPushDevice } from "@/lib/push-device";

vi.mock("@/lib/client/notifications", () => ({
  registerPushToken: vi.fn(),
  unregisterPushToken: vi.fn(),
}));
vi.mock("@/lib/firebase/messaging", () => ({
  currentPushToken: vi.fn(),
  forgetPushToken: vi.fn(),
  pushPermission: vi.fn(),
  pushSupported: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(pushSupported).mockResolvedValue(true);
  vi.mocked(pushPermission).mockReturnValue("granted");
  vi.mocked(currentPushToken).mockResolvedValue("fcm-token");
});

describe("syncPushDevice", () => {
  it("registers the browser's token once notifications are allowed", async () => {
    await syncPushDevice();

    expect(registerPushToken).toHaveBeenCalledWith("fcm-token");
  });

  it("does nothing before the user allows notifications", async () => {
    vi.mocked(pushPermission).mockReturnValue("default");

    await syncPushDevice();

    expect(currentPushToken).not.toHaveBeenCalled();
    expect(registerPushToken).not.toHaveBeenCalled();
  });
});

describe("unregisterPushDevice", () => {
  it("tells the server first, then forgets the token locally", async () => {
    const order: string[] = [];
    vi.mocked(unregisterPushToken).mockImplementation(async () => {
      order.push("server");
    });
    vi.mocked(forgetPushToken).mockImplementation(async () => {
      order.push("local");
    });

    await unregisterPushDevice();

    expect(unregisterPushToken).toHaveBeenCalledWith("fcm-token");
    expect(order).toEqual(["server", "local"]);
  });

  it("skips browsers without push", async () => {
    vi.mocked(pushSupported).mockResolvedValue(false);

    await unregisterPushDevice();

    expect(unregisterPushToken).not.toHaveBeenCalled();
  });
});
