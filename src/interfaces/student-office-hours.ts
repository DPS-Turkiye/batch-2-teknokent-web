import type { AppointmentTime } from "@/interfaces/appointment";

/** One topic an academician offers to talk about ("Araştırma projeleri" + a short line). */
export type OfficeHoursTopic = {
  title: string;
  body: string;
};

export type OfficeHoursCourse = {
  code: string;
  name: string;
};

/**
 * An academician as a student browses Office Hours (Figma 80:400 / 116:126). Sample data until an Office Hours
 * source serves ODTÜ-signed-in students; the shape is what the screens need from it.
 */
export type OfficeHoursAcademician = {
  id: string;
  /** Their Menton account, which tells the student's advisor apart; null in sample data. */
  accountId: string | null;
  fullName: string;
  academicTitle: string | null;
  department: string | null;
  faculty: string | null;
  tags: string[];
  about: string | null;
  topics: OfficeHoursTopic[];
  courses: OfficeHoursCourse[];
  place: string | null;
  durationMinutes: number;
  /** Free text ("genellikle 1 gün içinde"). */
  responseTime: string | null;
};

/** A bookable time; `available` is false once someone else has it or it has passed. */
export type StudentOfficeHoursSlot = AppointmentTime & {
  available: boolean;
};

/** The "Randevu talep et" form: a title the coordinator may see and a description only the academician reads. */
export type StudentOfficeHoursRequestInput = {
  academicianId: string;
  slot: AppointmentTime;
  title: string;
  description: string;
};
