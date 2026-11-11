import type { Appointment } from "@/interfaces/appointment";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursRequestInput,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import {
  OFFICE_HOURS_ACADEMICIANS_SAMPLE,
  sampleOfficeHoursSlots,
} from "@/lib/client/fixtures/student-office-hours";
import {
  addSampleOfficeHoursRequest,
  answerSampleOfficeHoursAlternative,
  sampleStudentOfficeHoursAppointments,
} from "@/lib/client/fixtures/student-office-hours-store";

// Sample data only: no Office Hours source serves ODTÜ-signed-in students yet (ODTÜ edition, not on prod).
// Connecting one replaces these bodies with calls to the app's own /api routes; the hooks and screens stay.

export function getOfficeHoursAcademicians(): Promise<
  OfficeHoursAcademician[]
> {
  return fixtureResponse(OFFICE_HOURS_ACADEMICIANS_SAMPLE);
}

export function getOfficeHoursAcademician(
  id: string,
): Promise<OfficeHoursAcademician | null> {
  return fixtureResponse(
    OFFICE_HOURS_ACADEMICIANS_SAMPLE.find((item) => item.id === id) ?? null,
  );
}

/** The academician's slots from `from` for `days` days. */
export function getOfficeHoursSlots(
  academicianId: string,
  from: Date,
  days: number,
  durationMinutes: number,
): Promise<StudentOfficeHoursSlot[]> {
  return fixtureResponse(
    sampleOfficeHoursSlots(
      academicianId,
      from,
      days,
      durationMinutes,
      new Date(),
    ),
  );
}

export function requestOfficeHours(
  input: StudentOfficeHoursRequestInput,
  academician: OfficeHoursAcademician,
): Promise<Appointment> {
  return fixtureResponse(addSampleOfficeHoursRequest(input, academician));
}

export function getStudentOfficeHoursAppointments(): Promise<Appointment[]> {
  return fixtureResponse(sampleStudentOfficeHoursAppointments());
}

export async function answerOfficeHoursAlternative(
  appointmentId: string,
  accept: boolean,
): Promise<Appointment> {
  return fixtureResponse(
    answerSampleOfficeHoursAlternative(appointmentId, accept),
  );
}
