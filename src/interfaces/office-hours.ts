/** A person's role in an office-hours course, as Moodle gave it on the LTI launch. */
export enum OfficeHoursRole {
  Instructor = "INSTRUCTOR",
  Student = "STUDENT",
}

/** Who came in through an LTI launch; kept in the office-hours session cookie. */
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

/** Why a launch from Moodle did not open office hours; picks the text on the error page. */
export enum LtiLaunchError {
  Unavailable = "unavailable",
  Rejected = "rejected",
  NoRole = "no-role",
  Expired = "expired",
}
