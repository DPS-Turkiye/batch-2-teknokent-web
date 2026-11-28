import axios from "axios";
import { getLocale } from "next-intl/server";
import "server-only";

import { getBackendUrl } from "@/lib/const";
import type { BackendResponse } from "@/lib/server/api-response";

/**
 * Mail programs post here from the link in a mail (List-Unsubscribe-Post), so it stays a route of this app. The
 * backend path is public: the link's token is the only proof, so no credential and no session cookie go with it.
 */
export async function unsubscribeEmail(
  token: string,
): Promise<BackendResponse<null>> {
  const response = await axios.post<null>(
    `${getBackendUrl()}/api/email-center/unsubscribe`,
    { token },
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": await getLocale(),
      },
      timeout: 15000,
      validateStatus: () => true,
    },
  );
  return {
    data: response.data,
    headers: response.headers,
    status: response.status,
  };
}
