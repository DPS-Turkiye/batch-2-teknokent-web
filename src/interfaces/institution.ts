import type { IdentityKind } from "@/interfaces/session";

export enum StudyLevel {
  Lisans = "LISANS",
  YuksekLisans = "YUKSEK_LISANS",
  Doktora = "DOKTORA",
}

/** What ODTÜ says about the signed-in person; read-only in Menton. */
export type InstitutionRecord = {
  kinds: IdentityKind[];
  fullName: string;
  email: string | null;
  faculty: string | null;
  departmentName: string | null;
  classYear: number | null;
  programLevel: StudyLevel | null;
  academicTitle: string | null;
  iskurParticipant: boolean;
  /** userId is null until the advisor has signed in to Menton. */
  advisor: {
    userId: string | null;
    fullName: string;
    academicTitle: string | null;
  } | null;
  syncedAt: string | null;
};

export type InstitutionPersonSummary = {
  userId: string | null;
  fullName: string;
  departmentName: string | null;
  classYear: number | null;
  programLevel: StudyLevel | null;
};
