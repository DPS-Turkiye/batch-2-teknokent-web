import type { StudentHomeModel } from "@/hooks/use-student-home";
import { StudyLevel, type InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind } from "@/interfaces/session";

/** An ODTÜ student's institutional record with an advisor (Ana Sayfa's "Akademik Danışmanın"). */
export const STUDENT_RECORD: InstitutionRecord = {
  kinds: [IdentityKind.Student],
  fullName: "Ayşe Nur Yılmaz",
  email: "ayse@metu.edu.tr",
  faculty: "Mühendislik Fakültesi",
  departmentName: "Endüstri Mühendisliği",
  classYear: 3,
  programLevel: StudyLevel.Bachelor,
  academicTitle: null,
  iskurParticipant: false,
  advisor: {
    userId: "academician-1",
    fullName: "Elif Şahin",
    academicTitle: "Doç. Dr.",
  },
  syncedAt: "2026-11-08T09:00:00Z",
};

/** The complete `useStudentHome` result for view tests; override what the test is about. */
export function studentHomeModel(
  overrides: Partial<StudentHomeModel> = {},
): StudentHomeModel {
  return {
    isLoading: false,
    error: null,
    ready: true,
    greeting: "Günaydın",
    name: "Ayşe",
    advisor: STUDENT_RECORD.advisor,
    profileHref: "/student/profile",
    next: null,
    upcoming: [],
    confirmedCount: 0,
    awaiting: [],
    peerRequests: [],
    requestCount: 0,
    mentors: [],
    ...overrides,
  };
}
