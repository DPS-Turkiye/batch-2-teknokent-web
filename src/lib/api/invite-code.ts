import "server-only";

import type { InviteCodeCheck } from "@/interfaces/invite-code";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
import { clientAddressHeaders } from "@/lib/server/client-address";

/** The backend trusts the address header only on the service login, which is the one this call uses. */
export function checkInviteCode(code: string, clientAddress: string | null) {
  const headers = clientAddressHeaders(clientAddress);
  return backendRequest<InviteCodeCheck>({
    method: HttpMethod.Post,
    url: "/api/auth/invite-code/check",
    data: { code },
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  });
}
