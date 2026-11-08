export enum OfficeHoursRole {
  Instructor = "INSTRUCTOR",
  Student = "STUDENT",
}

export interface OfficeHoursSessionUser {
  userId: string;
  fullName: string;
}

export interface OfficeHoursSessionData {
  user?: OfficeHoursSessionUser;
  issuedAt?: number;
}

export interface LtiLaunchResult {
  userId: string;
  fullName: string;
  courseId: string;
  courseTitle: string;
  role: OfficeHoursRole;
}

export interface OfficeHoursCourse {
  courseId: string;
  title: string;
  shortName: string | null;
  role: OfficeHoursRole;
  userFullName: string;
}

export enum LtiLaunchError {
  Unavailable = "unavailable",
  Rejected = "rejected",
  NoRole = "no-role",
  Expired = "expired",
}
