import { describe, expect, it } from "vitest";

import { labelPersonalTeams } from "@/hooks/use-admin-overview";
import type { AdminOverviewResponse } from "@/interfaces/admin-overview";

function overview(): AdminOverviewResponse {
  return {
    programs: [],
    users: [],
    meetingsLast8Weeks: 0,
    mentorships: [
      {
        id: "m1",
        mentorId: "mentor-1",
        mentorName: "Deniz Kaya",
        organizationId: "personal-1",
        organizationName: null,
        status: "ACTIVE",
        startDate: "2026-11-01",
        endDate: null,
        progressPercent: 0,
        daysSinceMeeting: null,
      },
      {
        id: "m2",
        mentorId: "mentor-2",
        mentorName: "Elif Şahin",
        organizationId: "org-1",
        organizationName: "Flexvision",
        status: "ACTIVE",
        startDate: "2026-11-01",
        endDate: null,
        progressPercent: 0,
        daysSinceMeeting: null,
      },
    ],
    requests: [],
    bottlenecks: [],
  };
}

describe("labelPersonalTeams", () => {
  it("labels a student's personal team as peer mentoring and keeps real team names", () => {
    const labelled = labelPersonalTeams(overview(), "Akran mentorluğu");
    expect(labelled.mentorships.map((row) => row.organizationName)).toEqual([
      "Akran mentorluğu",
      "Flexvision",
    ]);
  });
});
