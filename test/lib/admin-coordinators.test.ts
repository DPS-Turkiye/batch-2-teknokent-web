import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  type CoordinatorCandidate,
  CoordinatorCandidateStatus,
} from "@/interfaces/admin-coordinator";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  addedMessage,
  programCoordinatorLabel,
  candidateMessage,
  isAssignable,
  nameRequired,
} from "@/lib/admin-coordinators";
import { isEmailAddress } from "@/lib/utils";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const t = createTranslator({
  locale: "tr",
  messages: tr,
  namespace: "adminCoordinators",
});
const tEn = createTranslator({
  locale: "en",
  messages: en,
  namespace: "adminCoordinators",
});

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

  it("explains what saving will do", () => {
    expect(
      candidateMessage(candidate(CoordinatorCandidateStatus.New), t),
    ).toContain("şifresini belirlemesi için bir e-posta");
    expect(
      candidateMessage(
        candidate(CoordinatorCandidateStatus.Promotable, UserRole.Mentor),
        t,
      ),
    ).toBe(
      "Ayşe Demir şu an mentor. Kaydederseniz rolü koordinatör olarak değişir.",
    );
    expect(
      candidateMessage(
        candidate(CoordinatorCandidateStatus.Promotable, UserRole.Mentor),
        tEn,
      ),
    ).toBe(
      "Ayşe Demir is currently a mentor. If you save, their role changes to coordinator.",
    );
    expect(
      candidateMessage(
        candidate(
          CoordinatorCandidateStatus.MentorInMentorship,
          UserRole.Mentor,
        ),
        t,
      ),
    ).toContain("Mentorlukları bitmeden koordinatör yapılamaz");
    expect(
      candidateMessage(
        candidate(CoordinatorCandidateStatus.TeamMember, UserRole.Mentee),
        t,
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
    expect(addedMessage(account, t)).toContain(
      "Şifre belirleme e-postası elif@teknokent.org adresine gönderildi.",
    );
    expect(
      addedMessage(
        { ...account, outcome: CoordinatorCandidateStatus.Promotable },
        t,
      ),
    ).toBe("Elif Demir artık koordinatör.");
    expect(
      addedMessage(
        { ...account, outcome: CoordinatorCandidateStatus.Promotable },
        tEn,
      ),
    ).toBe("Elif Demir is now a coordinator.");
  });

  it("recognises an email address loosely", () => {
    expect(isEmailAddress(" elif@teknokent.org ")).toBe(true);
    expect(isEmailAddress("elif@teknokent")).toBe(false);
    expect(isEmailAddress("elif teknokent.org")).toBe(false);
  });
});

describe("program coordinator helpers", () => {
  it("names the assigned coordinators, or says none is assigned", () => {
    expect(
      programCoordinatorLabel({ coordinatorName: "Elif Demir" }, "Atanmadı"),
    ).toBe("Elif Demir");
    expect(programCoordinatorLabel({ coordinatorName: null }, "Atanmadı")).toBe(
      "Atanmadı",
    );
  });
});
