import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { hasPermission } from "@/lib/permissions";

/** A declined or withdrawn request no longer ties a mentor to the startup (the backend agrees). */
const CLOSED_REQUESTS: ReadonlySet<MentorshipRequestStatus> = new Set([
  MentorshipRequestStatus.Declined,
  MentorshipRequestStatus.Withdrawn,
]);

/** The startups whose members a mentor may open: a live request from them, or a mentorship with them. */
export function mentorLinkedStartupIds(
  requests: readonly Pick<MentorshipRequest, "organizationId" | "status">[],
  mentorships: readonly Pick<RegularMentorship, "organizationId">[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const request of requests) {
    if (!CLOSED_REQUESTS.has(request.status)) ids.add(request.organizationId);
  }
  for (const mentorship of mentorships) ids.add(mentorship.organizationId);
  return ids;
}

type Viewer = {
  role: UserRole;
  permissions?: readonly UserRole[] | undefined;
  organizationId?: string | null | undefined;
  personalOrganization?: boolean | undefined;
};

/**
 * Whether a startup member's name may link to their profile page, matching who the backend lets read it.
 * Taking part in the same program is not enough, so other teams' members are shown as plain text. A
 * coordinator's reach depends on the programs they run, so they open people from their own dashboard instead.
 */
export function canOpenMemberProfile(
  viewer: Viewer,
  organizationId: string,
  mentorStartupIds: ReadonlySet<string>,
): boolean {
  if (hasPermission(viewer, UserRole.Admin)) return true;
  if (
    viewer.personalOrganization !== true &&
    viewer.organizationId === organizationId
  ) {
    return true;
  }
  return (
    hasPermission(viewer, UserRole.Mentor) &&
    mentorStartupIds.has(organizationId)
  );
}
