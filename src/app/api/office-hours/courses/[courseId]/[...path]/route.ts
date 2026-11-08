import { OFFICE_HOURS_COURSE_PATHS, officeHoursCourseUrl } from "@/lib/api/lti";
import { allowlistedProxy } from "@/lib/server/allowlisted-proxy";
import { requireOfficeHoursUser } from "@/lib/server/office-hours-session";

export const { GET, POST } = allowlistedProxy<{ courseId: string }>({
  requireUserId: async () => (await requireOfficeHoursUser()).userId,
  allowedPaths: OFFICE_HOURS_COURSE_PATHS,
  backendUrl: officeHoursCourseUrl,
  failureMessage: "officeHoursFailed",
});
