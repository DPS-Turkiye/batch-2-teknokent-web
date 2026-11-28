import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";
import type {
  OfficeHoursAcademicianMeeting,
  OfficeHoursAlternativeInput,
  OfficeHoursAnswerInput,
  OfficeHoursInboxRequest,
  OfficeHoursListedAcademician,
  OfficeHoursProfile,
  OfficeHoursRequestInput,
  OfficeHoursStudentRequest,
  OfficeHoursTimeRange,
} from "@/interfaces/office-hours-me";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

// Office hours for the signed-in Menton account (ODTÜ edition), through the app's own /api/office-hours/me routes.
const BASE = "/api/office-hours/me";

export async function getMyOfficeHoursAvailability() {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilitySettings>(`${BASE}/availability`),
  );
}

export async function saveMyOfficeHoursAvailability(
  payload: UpdateMentorAvailabilitySettingsPayload,
) {
  return requireSuccess(
    await backendHttp.put<MentorAvailabilitySettings>(
      `${BASE}/availability`,
      payload,
    ),
  );
}

export async function getMyOfficeHoursProfile() {
  return requireSuccess(
    await backendHttp.get<OfficeHoursProfile>(`${BASE}/profile`),
  );
}

export async function saveMyOfficeHoursProfile(profile: OfficeHoursProfile) {
  return requireSuccess(
    await backendHttp.put<OfficeHoursProfile>(`${BASE}/profile`, profile),
  );
}

export async function getOfficeHoursInbox() {
  return requireSuccess(
    await backendHttp.get<OfficeHoursInboxRequest[]>(`${BASE}/inbox`),
  );
}

export async function answerOfficeHoursRequest(
  requestId: string,
  answer: OfficeHoursAnswerInput,
) {
  return requireSuccess(
    await backendHttp.post<OfficeHoursInboxRequest>(
      `${BASE}/requests/${encodeURIComponent(requestId)}/decision`,
      answer,
    ),
  );
}

export async function getAcademicianOfficeHoursMeetings() {
  return requireSuccess(
    await backendHttp.get<OfficeHoursAcademicianMeeting[]>(`${BASE}/meetings`),
  );
}

export async function getListedAcademicians() {
  return requireSuccess(
    await backendHttp.get<OfficeHoursListedAcademician[]>(
      `${BASE}/academicians`,
    ),
  );
}

export async function getListedAcademician(academicianId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursListedAcademician>(
      `${BASE}/academicians/${encodeURIComponent(academicianId)}`,
    ),
  );
}

export async function getAcademicianOpenSlots(academicianId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursTimeRange[]>(
      `${BASE}/academicians/${encodeURIComponent(academicianId)}/slots`,
    ),
  );
}

export async function sendOfficeHoursRequest(input: OfficeHoursRequestInput) {
  return requireSuccess(
    await backendHttp.post<OfficeHoursStudentRequest>(
      `${BASE}/requests`,
      input,
    ),
  );
}

export async function getMyOfficeHoursRequests() {
  return requireSuccess(
    await backendHttp.get<OfficeHoursStudentRequest[]>(`${BASE}/appointments`),
  );
}

export async function answerOfficeHoursAlternative(
  requestId: string,
  answer: OfficeHoursAlternativeInput,
) {
  return requireSuccess(
    await backendHttp.post<OfficeHoursStudentRequest>(
      `${BASE}/requests/${encodeURIComponent(requestId)}/alternative`,
      answer,
    ),
  );
}
