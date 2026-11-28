"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LtiLaunchError } from "@/interfaces/office-hours";
import { ClientApiError } from "@/lib/client/api";
import {
  getOfficeHoursAvailability,
  getOfficeHoursCourse,
} from "@/lib/client/office-hours";
import { officeHoursSession } from "@/lib/client/office-hours-session";
import { ltiErrorPath } from "@/lib/lti";

/** Sends the person to the launch-error page with `reason` once `failed` is set. */
function useLaunchErrorRedirect(failed: LtiLaunchError | null) {
  const router = useRouter();
  useEffect(() => {
    if (failed) router.replace(ltiErrorPath(failed));
  }, [failed, router]);
}

/**
 * The course page's data. Without a live office-hours session, or for a course the person never launched from,
 * Moodle has to launch again: the launch-error page says the session expired.
 */
export function useOfficeHoursCoursePage(courseId: string) {
  const query = useQuery({
    queryKey: ["office-hours", "course", courseId],
    queryFn: () => getOfficeHoursCourse(courseId),
    retry: false,
  });
  useLaunchErrorRedirect(query.isError ? LtiLaunchError.Expired : null);
  return query.data ?? null;
}

/** 403 from the backend: the person is a student, who has no office hours of their own. */
function launchErrorOf(error: unknown) {
  return error instanceof ClientApiError && error.status === 403
    ? LtiLaunchError.NoRole
    : LtiLaunchError.Expired;
}

/** The academic's profile page: who they are, once the backend has said they are an academic. */
export function useOfficeHoursProfilePage() {
  const query = useQuery({
    queryKey: ["office-hours", "profile-access"],
    queryFn: async () => {
      const session = await officeHoursSession();
      await getOfficeHoursAvailability();
      return session;
    },
    retry: false,
  });
  useLaunchErrorRedirect(query.isError ? launchErrorOf(query.error) : null);
  return query.data ?? null;
}
