import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { ownOrganizationPath } from "@/lib/client/own-organization";

export type OrganizationInvite = {
  organizationId: string;
  inviteCode: string;
};

export async function getInviteCode() {
  return requireSuccess(
    await backendHttp.get<OrganizationInvite>(
      await ownOrganizationPath("/invite-code"),
    ),
  );
}

export async function rotateInviteCode() {
  return requireSuccess(
    await backendHttp.post<OrganizationInvite>(
      await ownOrganizationPath("/invite-code"),
      {},
    ),
  );
}
