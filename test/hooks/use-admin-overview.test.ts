import { describe, expect, it } from "vitest";

import { labelPersonalTeams } from "@/hooks/use-admin-overview";
import type { AdminOverviewResponse } from "@/interfaces/admin-overview";
import {
  MentorshipSource,
  MentorshipStatus,
} from "@/interfaces/coordinator-mentorship";

function overview(): AdminOverviewResponse {
  return {
    programs: [],
    users: [],
    meetingsLast8Weeks: 0,
    acceptedRequests: [
      {
        id: "r1",
        mentorId: "mentor-3",
        mentorName: "Nihan Öztürk",
        organizationId: "personal-2",
        organizationName: null,
        status: MentorshipStatus.Active,
        startDate: "2026-11-10",
        endDate: null,
        progressPercent: 0,
        daysSinceMeeting: null,
        source: MentorshipSource.AcceptedRequest,
      },
    ],
    mentorships: [
      {
        id: "m1",
        mentorId: "mentor-1",
        mentorName: "Deniz Kaya",
        organizationId: "personal-1",
        organizationName: null,
        status: MentorshipStatus.Active,
        startDate: "2026-11-01",
        endDate: null,
        progressPercent: 0,
        daysSinceMeeting: null,
        source: MentorshipSource.Mentorship,
      },
      {
        id: "m2",
        mentorId: "mentor-2",
        mentorName: "Elif Şahin",
        organizationId: "org-1",
        organizationName: "Flexvision",
        status: MentorshipStatus.Active,
        startDate: "2026-11-01",
        endDate: null,
        progressPercent: 0,
        daysSinceMeeting: null,
        source: MentorshipSource.Mentorship,
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
    expect(
      labelled.acceptedRequests.map((row) => row.organizationName),
    ).toEqual(["Akran mentorluğu"]);
  });
});
