import { describe, expect, it } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import {
  accountChip,
  preferenceRowsFor,
  toggledPreferences,
  webEditLinkFor,
} from "@/lib/mobile-account";

function session(overrides: Partial<AppSession>): AppSession {
  return {
    userId: "u1",
    email: "gamze@atlasai.co",
    fullName: "Gamze Kozak",
    jobTitle: "Takım yetkilisi",
    role: UserRole.Mentee,
    organizationName: "Atlas AI",
    ...overrides,
  };
}

describe("preferenceRowsFor", () => {
  it("shows task switches to mentees and startup switches to mentors", () => {
    expect(preferenceRowsFor(UserRole.Mentee).map((row) => row.key)).toEqual([
      "messages",
      "meetingReminders",
      "newTasks",
      "taskDeadlines",
    ]);
    expect(preferenceRowsFor(UserRole.Mentor).map((row) => row.key)).toEqual([
      "messages",
      "meetingReminders",
      "meetingChanges",
      "startupActivity",
    ]);
  });
});

describe("toggledPreferences", () => {
  it("flips one switch and keeps the rest", () => {
    const preferences = {
      messages: true,
      meetingReminders: true,
      meetingChanges: true,
      newTasks: true,
      taskDeadlines: false,
      startupActivity: true,
    };

    expect(toggledPreferences(preferences, "taskDeadlines")).toEqual({
      ...preferences,
      taskDeadlines: true,
    });
  });
});

describe("accountChip and webEditLinkFor", () => {
  it("describes a mentee by startup and title, a mentor as Mentor", () => {
    expect(accountChip(session({}))).toBe("Atlas AI · Takım yetkilisi");
    expect(
      accountChip(session({ role: UserRole.Mentor, jobTitle: "UX/UI" })),
    ).toBe("Mentor · UX/UI");
  });

  it("sends each role to its own profile on the web", () => {
    expect(webEditLinkFor(UserRole.Mentee).href).toBe("/profile?web=1");
    expect(webEditLinkFor(UserRole.Mentor).href).toBe("/mentor-profile?web=1");
  });
});
