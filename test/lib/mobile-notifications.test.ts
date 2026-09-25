import { describe, expect, it } from "vitest";

import { NotificationCategory } from "@/interfaces/notification";
import {
  groupNotifications,
  mobileTargetFor,
  notificationAge,
  notificationTone,
} from "@/lib/mobile-notifications";

const NOW = new Date(2026, 8, 25, 12, 0);

function notification(id: string, createdAt: Date) {
  return {
    id,
    title: "Yeni mesaj",
    body: "Merhaba",
    createdAt: createdAt.toISOString(),
  };
}

describe("mobileTargetFor", () => {
  it("opens the tab that matches the notification", () => {
    expect(mobileTargetFor(NotificationCategory.Message)).toBe("/m/messages");
    expect(mobileTargetFor(NotificationCategory.MeetingReminder)).toBe(
      "/m/calendar",
    );
    expect(mobileTargetFor(NotificationCategory.TaskDeadline)).toBe("/m/tasks");
    expect(mobileTargetFor(NotificationCategory.StartupActivity)).toBe(
      "/m/startups",
    );
  });

  it("falls back to the notification list for general or unknown categories", () => {
    expect(mobileTargetFor(NotificationCategory.General)).toBe(
      "/m/notifications",
    );
    expect(mobileTargetFor("SOMETHING_NEW")).toBe("/m/notifications");
    expect(mobileTargetFor(null)).toBe("/m/notifications");
  });
});

describe("notificationTone", () => {
  it("gives meeting changes the red calendar and unknown ones the neutral icon", () => {
    expect(notificationTone(NotificationCategory.MeetingChange).icon).toBe(
      "/mobile/notice-change.svg",
    );
    expect(notificationTone(undefined).icon).toBe(
      "/mobile/icon-info-muted.svg",
    );
  });
});

describe("notificationAge", () => {
  it("counts minutes, hours, then days", () => {
    expect(
      notificationAge(new Date(2026, 8, 25, 11, 59, 30).toISOString(), NOW),
    ).toBe("Şimdi");
    expect(
      notificationAge(new Date(2026, 8, 25, 11, 48).toISOString(), NOW),
    ).toBe("12 dk");
    expect(
      notificationAge(new Date(2026, 8, 25, 9, 0).toISOString(), NOW),
    ).toBe("3 sa");
    expect(
      notificationAge(new Date(2026, 8, 24, 20, 0).toISOString(), NOW),
    ).toBe("Dün");
    expect(
      notificationAge(new Date(2026, 8, 23, 20, 0).toISOString(), NOW),
    ).toBe("2 gün");
    expect(
      notificationAge(new Date(2026, 8, 10, 9, 0).toISOString(), NOW),
    ).toBe("10 Eyl");
  });
});

describe("groupNotifications", () => {
  it("splits today's notifications from earlier ones, newest first", () => {
    const groups = groupNotifications(
      [
        notification("old", new Date(2026, 8, 23, 9, 0)),
        notification("morning", new Date(2026, 8, 25, 9, 0)),
        notification("noon", new Date(2026, 8, 25, 11, 0)),
      ],
      NOW,
    );

    expect(groups.map((group) => group.label)).toEqual(["Bugün", "Önceki"]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "noon",
      "morning",
    ]);
    expect(groups[1]?.items.map((item) => item.id)).toEqual(["old"]);
  });

  it("drops an empty group", () => {
    expect(
      groupNotifications([notification("old", new Date(2026, 8, 20))], NOW).map(
        (group) => group.label,
      ),
    ).toEqual(["Önceki"]);
  });
});
