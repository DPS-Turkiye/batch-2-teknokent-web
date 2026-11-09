import { AppointmentStatus } from "@/interfaces/appointment";
import {
  OfficeHoursAppointmentAction,
  OfficeHoursMessageAuthor,
  OfficeHoursRequestAction,
  type AcademicianAppointment,
  type AcademicianAvailability,
  type OfficeHoursAnswer,
  type OfficeHoursProfileSettings,
  type OfficeHoursRequest,
  type UpdateAcademicianAvailabilityPayload,
} from "@/interfaces/academician-office-hours";
import {
  ACADEMICIAN_APPOINTMENTS_SAMPLE,
  ACADEMICIAN_AVAILABILITY_SAMPLE,
  ACADEMICIAN_REQUESTS_SAMPLE,
  OFFICE_HOURS_PROFILE_SAMPLE,
} from "@/lib/client/fixtures/academician-office-hours";

// Keeps the sample answers and edits for the session, so the screens behave as they will with a
// real source. Replaced, not extended, when an Office Hours backend is connected.

type SampleState = {
  requests: OfficeHoursRequest[];
  appointments: AcademicianAppointment[];
  availability: AcademicianAvailability;
  profile: OfficeHoursProfileSettings;
};

function fresh(): SampleState {
  return structuredClone({
    requests: ACADEMICIAN_REQUESTS_SAMPLE,
    appointments: ACADEMICIAN_APPOINTMENTS_SAMPLE,
    availability: ACADEMICIAN_AVAILABILITY_SAMPLE,
    profile: OFFICE_HOURS_PROFILE_SAMPLE,
  });
}

let state = fresh();

export function resetAcademicianSample() {
  state = fresh();
}

export function sampleState(): SampleState {
  return structuredClone(state);
}

function openRequest(id: string) {
  const request = state.requests.find((item) => item.id === id);
  if (!request || !request.allowedActions.length) {
    throw new Error("Bu talep artık yanıtlanamıyor.");
  }
  return request;
}

export function answerSampleRequest(id: string, answer: OfficeHoursAnswer) {
  const request = openRequest(id);
  if (!request.allowedActions.includes(answer.action)) {
    throw new Error("Bu talep artık yanıtlanamıyor.");
  }
  switch (answer.action) {
    case OfficeHoursRequestAction.Accept:
      state.requests = state.requests.filter((item) => item.id !== id);
      state.appointments.push({
        id: `sample-appointment-from-${id}`,
        kind: ACADEMICIAN_APPOINTMENTS_SAMPLE[0].kind,
        side: ACADEMICIAN_APPOINTMENTS_SAMPLE[0].side,
        status: AppointmentStatus.Confirmed,
        topic: request.topic,
        counterpart: request.student,
        place: state.profile.defaultPlace,
        onlineUrl: state.profile.onlineLink,
        alternative: null,
        rejectReason: null,
        courseName: request.courseName,
        lateCancel: false,
        allowedActions: [OfficeHoursAppointmentAction.Cancel],
        ...answer.time,
      });
      return null;
    case OfficeHoursRequestAction.Decline:
      state.requests = state.requests.filter((item) => item.id !== id);
      return null;
    case OfficeHoursRequestAction.ProposeTimes:
      request.status = AppointmentStatus.AlternativeProposed;
      request.proposedTimes = answer.times;
      request.allowedActions = [];
      return structuredClone(request);
    case OfficeHoursRequestAction.AskQuestion:
      request.messages.push({
        author: OfficeHoursMessageAuthor.Academician,
        body: answer.question,
        sentAt: new Date().toISOString(),
      });
      request.awaitingStudentReply = true;
      return structuredClone(request);
  }
}

export function cancelSampleAppointment(id: string, reason: string | null) {
  const appointment = state.appointments.find((item) => item.id === id);
  if (
    !appointment?.allowedActions.includes(OfficeHoursAppointmentAction.Cancel)
  ) {
    throw new Error("Bu randevu iptal edilemiyor.");
  }
  appointment.status = AppointmentStatus.Cancelled;
  appointment.rejectReason = reason;
  appointment.lateCancel =
    Date.parse(appointment.startsAt) - Date.now() < 24 * 60 * 60 * 1000;
  appointment.allowedActions = [];
  return structuredClone(appointment);
}

export function saveSampleAvailability(
  payload: UpdateAcademicianAvailabilityPayload,
) {
  state.availability = {
    ...payload,
    rules: payload.rules.map((rule, index) => ({
      ...rule,
      id: `sample-rule-${index + 1}`,
    })),
    oneOffs: payload.oneOffs.map((oneOff, index) => ({
      ...oneOff,
      id: `sample-one-off-${index + 1}`,
    })),
  };
  return structuredClone(state.availability);
}

export function saveSampleProfile(settings: OfficeHoursProfileSettings) {
  state.profile = { ...settings };
  return structuredClone(state.profile);
}
