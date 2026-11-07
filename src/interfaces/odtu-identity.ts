/**
 * The ODTÜ identity both student and academician screens read. Mirrors Lane I's design
 * (permissions on one account, institutional data kept read-only and apart from the profile)
 * so the fixtures and the backend agree on one shape.
 */
export enum Permission {
  Admin = "ADMIN",
  Coordinator = "COORDINATOR",
  Mentor = "MENTOR",
  Mentee = "MENTEE",
  Academician = "ACADEMICIAN",
}

export enum ProgramLevel {
  Lisans = "LISANS",
  YuksekLisans = "YUKSEK_LISANS",
  Doktora = "DOKTORA",
}

export type AcademicAdvisor = {
  userId: string | null;
  fullName: string;
  academicTitle: string | null;
};

/** What ODTÜ says about a person; shown read-only, never edited in Menton. */
export type InstitutionRecord = {
  fullName: string;
  email: string;
  faculty: string | null;
  departmentName: string | null;
  /** Students only. */
  classYear: number | null;
  programLevel: ProgramLevel | null;
  /** Academicians only (Prof. Dr., Dr. Öğr. Üyesi, Arş. Gör.). */
  academicTitle: string | null;
  /** Students only; null when ODTÜ has no advisor on record. */
  advisor: AcademicAdvisor | null;
  syncedAt: string;
};
