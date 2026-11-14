import type { StudentProfileOrigin } from "@/types/academician-office-hours";

/** The academician workspace's pages, in one place so a moved screen changes one line. */
export const ACADEMICIAN_ROUTES = {
  home: "/academician",
  appointments: "/academician/appointments",
  availability: "/academician/appointments/availability",
  advisees: "/academician/advisees",
  students: "/academician/students",
  profile: "/academician/profile",
} as const;

/** A student's full profile, with where its "←" link goes back to. */
export function studentProfileHref(userId: string, from: StudentProfileOrigin) {
  return `${ACADEMICIAN_ROUTES.students}/${encodeURIComponent(userId)}?from=${from}`;
}
