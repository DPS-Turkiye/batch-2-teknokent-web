import type {
  CreateOfficeHoursRequestPayload,
  OfficeHoursDecisionPayload,
  OfficeHoursMeeting,
  OfficeHoursPerson,
  OfficeHoursRequest,
  OfficeHoursSlot,
} from "@/interfaces/office-hours";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function coursePath(courseId: string, path: string) {
  return `/api/office-hours/courses/${encodeURIComponent(courseId)}/${path}`;
}

export async function getCourseInstructors(courseId: string) {
  return requireSuccess(
    await httpClient.get<OfficeHoursPerson[]>(
      coursePath(courseId, "instructors"),
    ),
  );
}

export async function getInstructorSlots(
  courseId: string,
  instructorId: string,
) {
  return requireSuccess(
    await httpClient.get<OfficeHoursSlot[]>(
      coursePath(
        courseId,
        `instructors/${encodeURIComponent(instructorId)}/slots`,
      ),
    ),
  );
}

export async function getOfficeHoursRequests(courseId: string) {
  return requireSuccess(
    await httpClient.get<OfficeHoursRequest[]>(
      coursePath(courseId, "requests"),
    ),
  );
}

export async function getOfficeHoursMeetings(courseId: string) {
  return requireSuccess(
    await httpClient.get<OfficeHoursMeeting[]>(
      coursePath(courseId, "meetings"),
    ),
  );
}

export async function createOfficeHoursRequest(
  courseId: string,
  payload: CreateOfficeHoursRequestPayload,
) {
  return requireSuccess(
    await httpClient.post<OfficeHoursRequest>(
      coursePath(courseId, "requests"),
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
    await httpClient.post<OfficeHoursRequest>(
      coursePath(
        courseId,
        `requests/${encodeURIComponent(requestId)}/${action.kind}`,
      ),
      action.payload ?? {},
    ),
  );
}
