import { describe, expect, it } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import {
  memberDisplayRole,
  teamMembersForMentorRequest,
} from "@/lib/mentor-request-team";

const session: AppSession = {
  userId: "user-1",
  email: "sudenaz@example.com",
  fullName: "Sudenaz Yılmaz",
  jobTitle: "Mentee",
  role: UserRole.Mentee,
  organizationId: "org-1",
  organizationName: "Team TNT",
};

describe("memberDisplayRole", () => {
  it("prefers job title over the account role", () => {
    expect(
      memberDisplayRole({ jobTitle: "Kurucu & CEO", role: "MENTEE" }),
    ).toBe("Kurucu & CEO");
  });

  it("falls back to Mentee when the title is missing", () => {
    expect(memberDisplayRole({ role: "MENTEE" })).toBe("Mentee");
  });
});

describe("teamMembersForMentorRequest", () => {
  it("lists every organization member, not only the signed-in user", () => {
    expect(
      teamMembersForMentorRequest(
        [
          {
            id: "user-1",
            email: "sudenaz@example.com",
            fullName: "Sudenaz Yılmaz",
            role: "MENTEE",
            jobTitle: "Mentee",
          },
          {
            id: "user-2",
            email: "ali@example.com",
            fullName: "Ali Veli",
            role: "MENTEE",
            jobTitle: "CTO",
          },
        ],
        session,
      ).map((member) => member.name),
    ).toEqual(["Sudenaz Yılmaz", "Ali Veli"]);
  });

  it("falls back to the session user when the members list has not loaded", () => {
    expect(teamMembersForMentorRequest(undefined, session)).toEqual([
      {
        id: "user-1",
        initials: "SY",
        name: "Sudenaz Yılmaz",
        role: "Mentee",
      },
    ]);
  });

  it("returns an empty list when there is no session and no members", () => {
    expect(teamMembersForMentorRequest(undefined, null)).toEqual([]);
  });
});
