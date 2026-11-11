import type {
  AcademicianAppointment,
  AcademicianAvailability,
  OfficeHoursAnswer,
  OfficeHoursProfileSettings,
  OfficeHoursRequest,
  UpdateAcademicianAvailabilityPayload,
} from "@/interfaces/academician-office-hours";
import {
  answerSampleRequest,
  cancelSampleAppointment,
  sampleState,
  saveSampleAvailability,
  saveSampleProfile,
} from "@/lib/client/fixtures/academician-office-hours-store";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";

// Sample data only: no Office Hours source serves ODTÜ-signed-in academicians yet. Connecting
// one (Göksu's backend through an account link, or a Menton-account service) replaces these
// bodies with calls to the app's own /api routes; the hooks and screens stay as they are.

async function sample<T>(run: () => T): Promise<T> {
  return fixtureResponse(run());
}

export function getAcademicianRequests(): Promise<OfficeHoursRequest[]> {
  return sample(() => sampleState().requests);
}

export function answerAcademicianRequest(
  id: string,
  answer: OfficeHoursAnswer,
): Promise<OfficeHoursRequest | null> {
  return sample(() => answerSampleRequest(id, answer));
}

export function getAcademicianAppointments(): Promise<
  AcademicianAppointment[]
> {
  return sample(() => sampleState().appointments);
}

export function cancelAcademicianAppointment(
  id: string,
  reason: string | null,
): Promise<AcademicianAppointment> {
  return sample(() => cancelSampleAppointment(id, reason));
}

export function getAcademicianAvailability(): Promise<AcademicianAvailability> {
  return sample(() => sampleState().availability);
}

export function saveAcademicianAvailability(
  payload: UpdateAcademicianAvailabilityPayload,
): Promise<AcademicianAvailability> {
  return sample(() => saveSampleAvailability(payload));
}

export function getOfficeHoursProfileSettings(): Promise<OfficeHoursProfileSettings> {
  return sample(() => sampleState().profile);
}

export function saveOfficeHoursProfileSettings(
  settings: OfficeHoursProfileSettings,
): Promise<OfficeHoursProfileSettings> {
  return sample(() => saveSampleProfile(settings));
}
