import { describe, expect, it } from "vitest";

import {
  type CoordinatorCandidate,
  CoordinatorCandidateStatus,
} from "@/interfaces/admin-coordinator";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  addedMessage,
  candidateMessage,
  isAssignable,
  nameRequired,
} from "@/lib/admin-coordinators";
import { isEmailAddress } from "@/lib/utils";

function candidate(
  status: CoordinatorCandidateStatus,
  role: UserRole | null = null,
): CoordinatorCandidate {
  return {
    email: "ayse@mentor.com",
    status,
    userId: role ? "user-1" : null,
    fullName: role ? "Ayşe Demir" : null,
    role,
  };
}

describe("admin coordinators", () => {
  it("allows new, promotable and deactivated emails and nothing else", () => {
    expect(isAssignable(candidate(CoordinatorCandidateStatus.New))).toBe(true);
    expect(
      isAssignable(
        candidate(CoordinatorCandidateStatus.Promotable, UserRole.Mentor),
      ),
    ).toBe(true);
    expect(
      isAssignable(
        candidate(
          CoordinatorCandidateStatus.Reactivatable,
          UserRole.Coordinator,
        ),
      ),
    ).toBe(true);
    for (const refused of [
      CoordinatorCandidateStatus.AlreadyCoordinator,
      CoordinatorCandidateStatus.Admin,
      CoordinatorCandidateStatus.TeamMember,
      CoordinatorCandidateStatus.MentorInMentorship,
    ]) {
      expect(isAssignable(candidate(refused, UserRole.Mentee))).toBe(false);
    }
    expect(isAssignable(undefined)).toBe(false);
  });

  it("explains what saving will do in Turkish", () => {
    expect(
      candidateMessage(candidate(CoordinatorCandidateStatus.New)),
    ).toContain("Şifremi unuttum");
    expect(
      candidateMessage(
        candidate(CoordinatorCandidateStatus.Promotable, UserRole.Mentor),
      ),
    ).toBe(
      "Ayşe Demir şu an mentor. Kaydederseniz rolü koordinatör olarak değişir.",
    );
    expect(
      candidateMessage(
        candidate(
          CoordinatorCandidateStatus.MentorInMentorship,
          UserRole.Mentor,
        ),
      ),
    ).toContain("Mentorlukları bitmeden koordinatör yapılamaz");
    expect(
      candidateMessage(
        candidate(CoordinatorCandidateStatus.TeamMember, UserRole.Mentee),
      ),
    ).toContain("Takım üyeleri koordinatör yapılamaz");
  });

  it("asks for a name only for a new person and words the result by outcome", () => {
    expect(nameRequired(candidate(CoordinatorCandidateStatus.New))).toBe(true);
    expect(
      nameRequired(
        candidate(CoordinatorCandidateStatus.Promotable, UserRole.Mentor),
      ),
    ).toBe(false);
    const account = {
      id: "c-1",
      email: "elif@teknokent.org",
      fullName: "Elif Demir",
      status: UserAccountStatus.Approved,
      outcome: CoordinatorCandidateStatus.New,
    };
    expect(addedMessage(account)).toContain("Şifremi unuttum");
    expect(
      addedMessage({
        ...account,
        outcome: CoordinatorCandidateStatus.Promotable,
      }),
    ).toBe("Elif Demir artık koordinatör.");
  });

  it("recognises an email address loosely", () => {
    expect(isEmailAddress(" elif@teknokent.org ")).toBe(true);
    expect(isEmailAddress("elif@teknokent")).toBe(false);
    expect(isEmailAddress("elif teknokent.org")).toBe(false);
  });
});
