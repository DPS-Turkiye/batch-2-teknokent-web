import type {
  OrganizationMember,
  OrganizationMemberInput,
  OrganizationMemberUpdate,
  OrganizationPendingMember,
} from "@/interfaces/organization-member";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { ownOrganizationPath } from "@/lib/client/own-organization";

/** The signed-in person's own team. */
export async function getOrganizationMembers() {
  return requireSuccess(
    await backendHttp.get<OrganizationMember[]>(
      await ownOrganizationPath("/members"),
    ),
  );
}

/** Another startup's team, for its mentors and staff; the backend refuses anyone else. */
export async function getOrganizationMembersById(organizationId: string) {
  return requireSuccess(
    await backendHttp.get<OrganizationMember[]>(
      `/api/organizations/${encodeURIComponent(organizationId)}/members`,
    ),
  );
}

export async function addOrganizationMember(input: OrganizationMemberInput) {
  return requireSuccess(
    await backendHttp.post<OrganizationMember>(
      await ownOrganizationPath("/members"),
      input,
    ),
  );
}

function memberPath(memberId: string) {
  return ownOrganizationPath(`/members/${encodeURIComponent(memberId)}`);
}

export async function updateOrganizationMember(
  memberId: string,
  update: OrganizationMemberUpdate,
) {
  return requireSuccess(
    await backendHttp.patch<OrganizationMember>(
      await memberPath(memberId),
      update,
    ),
  );
}

export async function removeOrganizationMember(memberId: string) {
  requireSuccess(await backendHttp.delete<void>(await memberPath(memberId)));
}

export async function getPendingMembers() {
  return requireSuccess(
    await backendHttp.get<OrganizationPendingMember[]>(
      await ownOrganizationPath("/pending-members"),
    ),
  );
}

export async function removePendingMember(pendingId: string) {
  requireSuccess(
    await backendHttp.delete<void>(
      await ownOrganizationPath(
        `/pending-members/${encodeURIComponent(pendingId)}`,
      ),
    ),
  );
}
