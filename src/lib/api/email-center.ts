import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** Mail programs post here from the link in a mail (List-Unsubscribe-Post), so it stays a route of this app. */
export function unsubscribeEmail(token: string) {
  return backendRequest<null>({
    method: HttpMethod.Post,
    url: "/api/email-center/unsubscribe",
    data: { token },
  });
}
