import type { MentorProfile } from "@/interfaces/mentor";

/** What a viewer may do on a mentor's profile page. */
export enum MentorPageAccess {
  /** A mentor of the viewer's active program (or anyone, for a viewer outside programs). */
  Request = "request",
  /** A mentor of another program the viewer is in: the profile shows, the request does not. */
  ViewOnly = "view-only",
  Hidden = "hidden",
}

/** The programs the mentor and the viewer share, by name, for the "switch program" note. */
export function sharedProgramNames(
  mentor: MentorProfile,
  viewerProgramIds: readonly string[],
): string[] {
  return (mentor.programs ?? [])
    .filter((program) => viewerProgramIds.includes(program.id))
    .map((program) => program.name);
}

/**
 * A mentee asks only their active program's mentors (the backend enforces it), but may look at
 * a mentor from any program they are in, so a link from a program page no longer ends in a 404.
 */
export function mentorPageAccess({
  reachable,
  mentor,
  viewerProgramIds,
}: {
  reachable: boolean;
  mentor: MentorProfile | null;
  viewerProgramIds: readonly string[];
}): MentorPageAccess {
  if (reachable) return MentorPageAccess.Request;
  if (mentor && sharedProgramNames(mentor, viewerProgramIds).length > 0) {
    return MentorPageAccess.ViewOnly;
  }
  return MentorPageAccess.Hidden;
}
