import type {
  FounderChangeOptions,
  FounderChangeResult,
} from "@/interfaces/founder-change";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

// The backend changes a founder only on the caller\'s own sign-in, which the API session cookie carries.
function founderPath(organizationId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}/founder`;
}

export async function getFounderChangeOptions(organizationId: string) {
  return requireSuccess(
    await backendHttp.get<FounderChangeOptions>(founderPath(organizationId)),
  );
}

export async function changeFounder(
  organizationId: string,
  newFounderId: string,
) {
  return requireSuccess(
    await backendHttp.post<FounderChangeResult>(founderPath(organizationId), {
      newFounderId,
    }),
  );
}
