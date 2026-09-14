import type {
  OrganizationMember,
  OrganizationMemberInput,
  OrganizationMemberUpdate,
} from "@/interfaces/organization-member";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getOrganizationMembers() {
  return requireSuccess(
    await httpClient.get<OrganizationMember[]>("/api/organization-members"),
  );
}

export async function addOrganizationMember(input: OrganizationMemberInput) {
  return requireSuccess(
    await httpClient.post<OrganizationMember>(
      "/api/organization-members",
      input,
    ),
  );
}

function memberUrl(memberId: string) {
  return `/api/organization-members/${encodeURIComponent(memberId)}`;
}

export async function updateOrganizationMember(
  memberId: string,
  update: OrganizationMemberUpdate,
) {
  return requireSuccess(
    await httpClient.patch<OrganizationMember>(memberUrl(memberId), update),
  );
}

export async function removeOrganizationMember(memberId: string) {
  return requireSuccess(await httpClient.delete(memberUrl(memberId)));
}
