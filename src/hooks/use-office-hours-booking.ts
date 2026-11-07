"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateOfficeHoursRequestPayload } from "@/interfaces/office-hours";
import {
  actOnOfficeHoursRequest,
  createOfficeHoursRequest,
  getCourseInstructors,
  getInstructorSlots,
  getOfficeHoursMeetings,
  getOfficeHoursRequests,
  type OfficeHoursRequestAction,
} from "@/lib/client/office-hours-booking";

const keys = {
  course: (courseId: string) => ["office-hours", "course", courseId] as const,
  instructors: (courseId: string) =>
    ["office-hours", "course", courseId, "instructors"] as const,
  slots: (courseId: string, instructorId: string) =>
    ["office-hours", "course", courseId, "slots", instructorId] as const,
  requests: (courseId: string) =>
    ["office-hours", "course", courseId, "requests"] as const,
  meetings: (courseId: string) =>
    ["office-hours", "course", courseId, "meetings"] as const,
};

export function useCourseInstructors(courseId: string) {
  return useQuery({
    queryKey: keys.instructors(courseId),
    queryFn: () => getCourseInstructors(courseId),
  });
}

export function useInstructorSlots(
  courseId: string,
  instructorId: string | null,
) {
  return useQuery({
    queryKey: keys.slots(courseId, instructorId ?? ""),
    queryFn: () => getInstructorSlots(courseId, instructorId ?? ""),
    enabled: Boolean(instructorId),
  });
}

export function useOfficeHoursRequests(courseId: string) {
  return useQuery({
    queryKey: keys.requests(courseId),
    queryFn: () => getOfficeHoursRequests(courseId),
  });
}

export function useOfficeHoursMeetings(courseId: string) {
  return useQuery({
    queryKey: keys.meetings(courseId),
    queryFn: () => getOfficeHoursMeetings(courseId),
  });
}

/** Any change to a request can change the course's requests, meetings and free slots. */
function useRefreshCourse(courseId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: keys.course(courseId) });
}

export function useCreateOfficeHoursRequest(courseId: string) {
  const refresh = useRefreshCourse(courseId);
  return useMutation({
    mutationFn: (payload: CreateOfficeHoursRequestPayload) =>
      createOfficeHoursRequest(courseId, payload),
    onSuccess: refresh,
  });
}

export function useOfficeHoursRequestAction(courseId: string) {
  const refresh = useRefreshCourse(courseId);
  return useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: OfficeHoursRequestAction;
    }) => actOnOfficeHoursRequest(courseId, requestId, action),
    onSuccess: refresh,
  });
}
