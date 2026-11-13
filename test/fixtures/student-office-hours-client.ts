import type { Appointment } from "@/interfaces/appointment";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursRequestInput,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";
import {
  OFFICE_HOURS_ACADEMICIANS_SAMPLE,
  sampleOfficeHoursSlots,
} from "@/lib/client/fixtures/student-office-hours";
import {
  addSampleOfficeHoursRequest,
  answerSampleOfficeHoursAlternative,
  sampleSlotRequested,
  sampleStudentOfficeHoursAppointments,
} from "@/lib/client/fixtures/student-office-hours-store";

/**
 * `lib/client/student-office-hours` for screen tests: the sample academicians, their weekly slots and an in-memory
 * request store, so a screen test reads like a session. The real client's mapping is tested on its own.
 */

let advisorAccount: string | null = null;

/** Lists the first sample academician as the student's advisor (their Menton account), or no one with null. */
export function listAdvisorAs(accountId: string | null) {
  advisorAccount = accountId;
}

function academicians(): OfficeHoursAcademician[] {
  return OFFICE_HOURS_ACADEMICIANS_SAMPLE.map((item, index) =>
    index === 0 && advisorAccount
      ? { ...item, accountId: advisorAccount }
      : item,
  );
}

function sampleAcademician(id: string) {
  return academicians().find((item) => item.id === id);
}

export function getOfficeHoursAcademicians(): Promise<
  OfficeHoursAcademician[]
> {
  return Promise.resolve(academicians());
}

export function getOfficeHoursAcademician(
  id: string,
): Promise<OfficeHoursAcademician | null> {
  return Promise.resolve(sampleAcademician(id) ?? null);
}

/** A time the student already asked for is not free, as the backend refuses a second ask for it. */
export function getOfficeHoursSlots(
  academicianId: string,
  from: Date,
  days: number,
): Promise<StudentOfficeHoursSlot[]> {
  const minutes = sampleAcademician(academicianId)?.durationMinutes ?? 30;
  return Promise.resolve(
    sampleOfficeHoursSlots(academicianId, from, days, minutes, new Date()).map(
      (slot) =>
        sampleSlotRequested(academicianId, slot.startsAt)
          ? { ...slot, available: false }
          : slot,
    ),
  );
}

export function requestOfficeHours(
  input: StudentOfficeHoursRequestInput,
): Promise<Appointment> {
  const academician = sampleAcademician(input.academicianId);
  if (!academician) return Promise.reject(new Error("Academician not found."));
  try {
    return Promise.resolve(addSampleOfficeHoursRequest(input, academician));
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error("failed"));
  }
}

export function getStudentOfficeHoursAppointments(): Promise<Appointment[]> {
  return Promise.resolve(sampleStudentOfficeHoursAppointments());
}

export function answerOfficeHoursAlternative(
  appointmentId: string,
  accept: boolean,
): Promise<Appointment> {
  try {
    return Promise.resolve(
      answerSampleOfficeHoursAlternative(appointmentId, accept),
    );
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error("failed"));
  }
}
