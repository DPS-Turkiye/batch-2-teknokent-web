import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  markAllNotificationsRead,
  registerPushToken,
  saveNotificationPreferences,
  unregisterPushToken,
} from "@/lib/client/notifications";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
}));
vi.mock("@/lib/const", () => ({
  getPublicBackendUrl: () => "http://backend",
}));

const AUTH = { headers: { Authorization: "Bearer id-token" } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.put).mockResolvedValue({ data: {} });
});

describe("notifications client", () => {
  it("marks every notification read", async () => {
    await markAllNotificationsRead();

    expect(axios.patch).toHaveBeenCalledWith(
      "http://backend/api/notifications/read-all",
      undefined,
      AUTH,
    );
  });

  it("saves all preferences at once", async () => {
    const preferences = {
      messages: true,
      meetingReminders: false,
      meetingChanges: true,
      newTasks: true,
      taskDeadlines: false,
      startupActivity: true,
    };

    await saveNotificationPreferences(preferences);

    expect(axios.put).toHaveBeenCalledWith(
      "http://backend/api/notifications/preferences",
      preferences,
      AUTH,
    );
  });

  it("registers and removes this browser's push token", async () => {
    await registerPushToken("fcm");
    await unregisterPushToken("fcm");

    expect(axios.post).toHaveBeenCalledWith(
      "http://backend/api/notifications/push-tokens",
      { token: "fcm" },
      AUTH,
    );
    expect(axios.delete).toHaveBeenCalledWith(
      "http://backend/api/notifications/push-tokens",
      { data: { token: "fcm" }, ...AUTH },
    );
  });
});
