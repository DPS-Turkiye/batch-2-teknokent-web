import type {
  CreateOfficeHoursRequestPayload,
  OfficeHoursDecisionPayload,
  OfficeHoursMeeting,
  OfficeHoursPerson,
  OfficeHoursRequest,
  OfficeHoursSlot,
} from "@/interfaces/office-hours";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { officeHoursUserPath } from "@/lib/client/office-hours-session";

/** One of the session's own courses on the backend. */
function coursePath(courseId: string, path: string) {
  return officeHoursUserPath(`courses/${encodeURIComponent(courseId)}/${path}`);
}

export async function getCourseInstructors(courseId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursPerson[]>(
      await coursePath(courseId, "instructors"),
    ),
  );
}

export async function getInstructorSlots(
  courseId: string,
  instructorId: string,
) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursSlot[]>(
      await coursePath(
        courseId,
        `instructors/${encodeURIComponent(instructorId)}/slots`,
      ),
    ),
  );
}

export async function getOfficeHoursRequests(courseId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursRequest[]>(
      await coursePath(courseId, "requests"),
    ),
  );
}

export async function getOfficeHoursMeetings(courseId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursMeeting[]>(
      await coursePath(courseId, "meetings"),
    ),
  );
}

export async function createOfficeHoursRequest(
  courseId: string,
  payload: CreateOfficeHoursRequestPayload,
) {
  return requireSuccess(
    await backendHttp.post<OfficeHoursRequest>(
      await coursePath(courseId, "requests"),
      payload,
    ),
  );
}

export type OfficeHoursRequestAction =
  | { kind: "decision"; payload: OfficeHoursDecisionPayload }
  | { kind: "reply"; payload: { message: string } }
  | { kind: "accept-proposed"; payload: { slot: string } }
  | { kind: "withdraw"; payload?: undefined };

export async function actOnOfficeHoursRequest(
  courseId: string,
  requestId: string,
  action: OfficeHoursRequestAction,
) {
  return requireSuccess(
    await backendHttp.post<OfficeHoursRequest>(
      await coursePath(
        courseId,
        `requests/${encodeURIComponent(requestId)}/${action.kind}`,
      ),
      action.payload ?? {},
    ),
  );
}
