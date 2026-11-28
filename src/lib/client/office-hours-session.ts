import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export type OfficeHoursSession = { userId: string; fullName: string };

let current: Promise<OfficeHoursSession> | null = null;

/**
 * Whose office hours these are: the person the LTI launch from Moodle signed in, read from the backend's own
 * office-hours session cookie once per page load. A failed read is not kept.
 */
export function officeHoursSession(): Promise<OfficeHoursSession> {
  current ??= backendHttp
    .get<OfficeHoursSession>("/api/office-hours/session")
    .then(requireSuccess)
    .catch((error: unknown) => {
      current = null;
      throw error;
    });
  return current;
}

/** A path under the session's own person; the backend refuses any other. */
export async function officeHoursUserPath(suffix: string) {
  const { userId } = await officeHoursSession();
  return `/api/office-hours/users/${encodeURIComponent(userId)}/${suffix}`;
}
