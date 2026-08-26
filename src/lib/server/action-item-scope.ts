import "server-only";

import { fetchMentorRequest } from "@/lib/api/mentor-requests";

/**
 * Action items are organization-scoped, but a mentor's session carries no
 * startup organization — the relevant one belongs to the mentorship request
 * being viewed. Resolve it from the request server-side so the browser can
 * never choose which organization's items it reads or writes.
 */
export async function resolveOrganizationIdForRequest(requestId: string) {
  const response = await fetchMentorRequest(requestId);
  const organizationId = (response.data as { organizationId?: string })
    ?.organizationId;

  if (response.status >= 400 || !organizationId) {
    throw new Error(`Could not resolve organization for request ${requestId}`);
  }

  return organizationId;
}
