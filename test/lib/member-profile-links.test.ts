import { describe, expect, it } from "vitest";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  canOpenMemberProfile,
  mentorLinkedStartupIds,
} from "@/lib/member-profile-links";

describe("mentorLinkedStartupIds", () => {
  it("keeps startups with a live request or a mentorship", () => {
    const ids = mentorLinkedStartupIds(
      [
        { organizationId: "pending", status: MentorshipRequestStatus.Pending },
        {
          organizationId: "more-info",
          status: MentorshipRequestStatus.MoreInfoRequested,
        },
        {
          organizationId: "counter",
          status: MentorshipRequestStatus.CounterProposed,
        },
        {
          organizationId: "accepted",
          status: MentorshipRequestStatus.Accepted,
        },
      ],
      [{ organizationId: "mentored" }],
    );

    expect([...ids].sort((a, b) => a.localeCompare(b))).toEqual([
      "accepted",
      "counter",
      "mentored",
      "more-info",
      "pending",
    ]);
  });

  it("drops startups whose only request was declined or withdrawn", () => {
    const ids = mentorLinkedStartupIds(
      [
        {
          organizationId: "declined",
          status: MentorshipRequestStatus.Declined,
        },
        {
          organizationId: "withdrawn",
          status: MentorshipRequestStatus.Withdrawn,
        },
      ],
      [],
    );

    expect(ids.size).toBe(0);
  });
});

describe("canOpenMemberProfile", () => {
  const none = new Set<string>();

  it("lets a mentee open only their own teammates", () => {
    const mentee = { role: UserRole.Mentee, organizationId: "own" };

    expect(canOpenMemberProfile(mentee, "own", none)).toBe(true);
    expect(canOpenMemberProfile(mentee, "other", none)).toBe(false);
  });

  it("lets a mentee without a startup open nobody", () => {
    expect(canOpenMemberProfile({ role: UserRole.Mentee }, "own", none)).toBe(
      false,
    );
  });

  it("lets a mentor open only the startups they mentor or were asked by", () => {
    const mentor = { role: UserRole.Mentor };

    expect(canOpenMemberProfile(mentor, "linked", new Set(["linked"]))).toBe(
      true,
    );
    expect(canOpenMemberProfile(mentor, "other", new Set(["linked"]))).toBe(
      false,
    );
  });

  it("lets an admin open anyone the page lists", () => {
    expect(canOpenMemberProfile({ role: UserRole.Admin }, "any", none)).toBe(
      true,
    );
  });

  // A coordinator's reach depends on the programs they run; they open people from their dashboard instead.
  it("does not link members for a coordinator", () => {
    expect(
      canOpenMemberProfile({ role: UserRole.Coordinator }, "any", none),
    ).toBe(false);
  });

  it("does not treat a personal team as a startup to share", () => {
    const student = {
      role: UserRole.Mentee,
      organizationId: "personal",
      personalOrganization: true,
    };

    expect(canOpenMemberProfile(student, "personal", none)).toBe(false);
  });

  it("uses every permission a dual-role account holds", () => {
    const menteeAndMentor = {
      role: UserRole.Mentee,
      permissions: [UserRole.Mentee, UserRole.Mentor],
      organizationId: "own",
    };

    expect(
      canOpenMemberProfile(menteeAndMentor, "linked", new Set(["linked"])),
    ).toBe(true);
    expect(canOpenMemberProfile(menteeAndMentor, "own", none)).toBe(true);
    expect(canOpenMemberProfile(menteeAndMentor, "other", none)).toBe(false);
  });
});
