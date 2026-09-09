import { describe, expect, it } from "vitest";
import { mentorWeekMeetingCount } from "@/lib/mentor-dashboard";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

function meeting(
  scheduledAt: string,
  status = MeetingStatus.Scheduled,
): MeetingItem {
  return {
    id: scheduledAt,
    organizationId: "org",
    scheduledAt,
    durationMinutes: 45,
    status,
  };
}
describe("mentorWeekMeetingCount", () => {
  it("uses Monday-to-Sunday Istanbul boundaries, includes completed meetings, and excludes cancelled ones", () => {
    const meetings = [
      meeting("2026-09-06T20:59:59Z"),
      meeting("2026-09-06T21:00:00Z", MeetingStatus.Completed),
      meeting("2026-09-09T09:00:00Z"),
      meeting("2026-09-10T09:00:00Z", MeetingStatus.Cancelled),
      meeting("2026-09-13T20:59:59Z"),
      meeting("2026-09-13T21:00:00Z"),
      meeting("invalid"),
    ];
    expect(
      mentorWeekMeetingCount(meetings, new Date("2026-09-09T12:00:00Z")),
    ).toBe(3);
  });
  it("changes week at midnight in Istanbul even while UTC is still Sunday", () => {
    const meetings = [meeting("2026-09-13T21:00:00Z")];
    expect(
      mentorWeekMeetingCount(meetings, new Date("2026-09-13T21:01:00Z")),
    ).toBe(1);
    expect(mentorWeekMeetingCount([], new Date("2026-09-13T21:01:00Z"))).toBe(
      0,
    );
  });
});
