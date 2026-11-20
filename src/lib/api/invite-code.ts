import "server-only";

import type { InviteCodeCheck } from "@/interfaces/invite-code";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend trusts this header only on the service login, which is the one this call uses. */
export const CLIENT_ADDRESS_HEADER = "X-Menton-Client-Address";

export function checkInviteCode(code: string, clientAddress: string | null) {
  return backendRequest<InviteCodeCheck>({
    method: HttpMethod.Post,
    url: "/api/auth/invite-code/check",
    data: { code },
    ...(clientAddress
      ? { headers: { [CLIENT_ADDRESS_HEADER]: clientAddress } }
      : {}),
  });
}
