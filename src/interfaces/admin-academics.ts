/** An academician from the institution's records (Admin › Kullanıcılar › Akademisyenler); read-only. */
export type AdminAcademic = {
  personId: string;
  /** Null until they first sign in with their institution account. */
  userId: string | null;
  fullName: string;
  email: string | null;
  academicTitle: string | null;
  faculty: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  /** The institution still lists them as active. */
  active: boolean;
  signedIn: boolean;
  lastLoginAt: string | null;
  adviseeCount: number;
};

export enum AcademicFilter {
  All = "ALL",
  SignedIn = "SIGNED_IN",
  NotSignedIn = "NOT_SIGNED_IN",
  Inactive = "INACTIVE",
}
