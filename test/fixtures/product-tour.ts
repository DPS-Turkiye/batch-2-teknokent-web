import { Edition } from "@/interfaces/edition";
import { StudyLevel, type InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { writeTourRun } from "@/lib/product-tour-storage";
import { useProductTourStore } from "@/stores/product-tour-store";
import { TourPhase, type TourRole } from "@/types/product-tour";

/** An ODTÜ student's institution record; `iskurParticipant` decides which tour they get. */
export function institutionRecord(
  overrides: Partial<InstitutionRecord> = {},
): InstitutionRecord {
  return {
    kinds: [IdentityKind.Student],
    fullName: "Ayşe Yılmaz",
    email: "ayse.yilmaz@odtu-dev.invalid",
    faculty: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    classYear: 3,
    programLevel: StudyLevel.Bachelor,
    academicTitle: null,
    iskurParticipant: false,
    advisor: null,
    syncedAt: "2026-11-08T09:00:00Z",
    ...overrides,
  };
}

/** An ODTÜ account on the ODTÜ deployment: since #336 the workspace exists only in that edition. */
export function odtuSession(overrides: Partial<AppSession> = {}): AppSession {
  return {
    edition: Edition.Odtu,
    userId: "student-1",
    email: "ayse.yilmaz@odtu-dev.invalid",
    fullName: "Ayşe Yılmaz",
    jobTitle: "",
    role: UserRole.Mentee,
    institutionKinds: [IdentityKind.Student],
    ...overrides,
  };
}

/** Forgets every tour: the in-memory run and what this browser saved. */
export function resetProductTour() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useProductTourStore.setState({ userId: null, run: null, dismissed: [] });
}

/** A tour left open at a step, as a reload finds it in the tab. */
export function seedTourStep(
  userId: string,
  role: TourRole,
  stepIndex: number,
) {
  writeTourRun(userId, { role, phase: TourPhase.Step, stepIndex });
}
