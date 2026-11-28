import { UserRole, type AppSession } from "@/interfaces/session";
import { webHref } from "@/lib/mobile";
import { loginPathFor } from "@/lib/public-paths";
import { roleWorkspace } from "@/lib/role-workspace";
import { STUDENT_PROJECT_HREF } from "@/lib/startup-tabs";

/**
 * Where a startup page sends someone it is not for, or null when they stay. A student of an individual program
 * has no startup pages. A `strict` page is also only for a signed-in mentee with a startup.
 */
export function startupPageRedirect(input: {
  session: AppSession | null;
  individual: boolean;
  strict: boolean;
  path: string;
}): string | null {
  const { session, individual, strict, path } = input;
  if (strict) {
    if (!session) return loginPathFor(path);
    if (session.role !== UserRole.Mentee) {
      return roleWorkspace(session.role).homeHref;
    }
    if (!session.organizationId) return "/profile/personal";
  }
  return individual ? STUDENT_PROJECT_HREF : null;
}

/**
 * Where /profile leads: a startup member to the startup's profile tools, everyone else (a student of an individual
 * program too, who has no startup profile) to their role's profile. `web` keeps the phone's web choice.
 */
export function profileDestination(input: {
  session: AppSession | null;
  individual: boolean;
  web: boolean;
}): string {
  const { session, individual, web } = input;
  if (!session) return loginPathFor("/profile");
  const destination =
    session.role === UserRole.Mentee && session.organizationId && !individual
      ? "/startup/profile-tools"
      : roleWorkspace(session.role).profileHref;
  return web ? webHref(destination) : destination;
}
