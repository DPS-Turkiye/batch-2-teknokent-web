import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export type OrganizationInvite = {
  organizationId: string;
  inviteCode: string;
};

export async function getInviteCode() {
  return requireSuccess(
    await httpClient.get<OrganizationInvite>("/api/organizations/invite-code"),
  );
}

export async function rotateInviteCode() {
  return requireSuccess(
    await httpClient.post<OrganizationInvite>("/api/organizations/invite-code"),
  );
}
