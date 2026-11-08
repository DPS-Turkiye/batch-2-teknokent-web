import "server-only";

import { UserRole, type AppSession } from "@/interfaces/session";
import { hasPermission } from "@/lib/permissions";

export type MentoringSide = UserRole.Mentor | UserRole.Mentee;

/** The query parameter a screen uses to say which side it shows, e.g. the student's "Mentorluk Ver" tab. */
export const SIDE_PARAM = "as";

/**
 * Which side of mentoring a call acts on. An account can be both (a student who mentors and is mentored), so a
 * screen names the side with `as`; it must be one the account holds. Without it, the primary role decides, so
 * single-role accounts and older screens behave as before. null when the account holds neither side.
 */
export function sessionSide(
  session: AppSession,
  requested?: string | null,
): MentoringSide | null {
  if (requested === UserRole.Mentor || requested === UserRole.Mentee) {
    return hasPermission(session, requested) ? requested : null;
  }
  if (session.role === UserRole.Mentor) return UserRole.Mentor;
  if (hasPermission(session, UserRole.Mentee)) return UserRole.Mentee;
  if (hasPermission(session, UserRole.Mentor)) return UserRole.Mentor;
  return null;
}
