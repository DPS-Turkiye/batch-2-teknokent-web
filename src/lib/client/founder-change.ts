import type {
  FounderChangeOptions,
  FounderChangeResult,
} from "@/interfaces/founder-change";
import { requireSuccess } from "@/lib/client/api";
import { bearerHeader } from "@/lib/client/bearer";
import { httpClient } from "@/lib/http-client";

// The backend changes a founder only on the caller's own sign-in, so both calls carry the Firebase token.
function founderPath(organizationId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}/founder`;
}

export async function getFounderChangeOptions(organizationId: string) {
  return requireSuccess(
    await httpClient.get<FounderChangeOptions>(founderPath(organizationId), {
      headers: await bearerHeader(),
    }),
  );
}

export async function changeFounder(
  organizationId: string,
  newFounderId: string,
) {
  return requireSuccess(
    await httpClient.post<FounderChangeResult>(
      founderPath(organizationId),
      { newFounderId },
      { headers: await bearerHeader() },
    ),
  );
}
