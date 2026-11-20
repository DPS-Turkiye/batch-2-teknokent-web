import "server-only";

import type {
  FounderChangeOptions,
  FounderChangeResult,
} from "@/interfaces/founder-change";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

function founderUrl(organizationId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}/founder`;
}

/** The backend takes the caller from this token alone, never from the shared service credentials. */
export function fetchFounderChangeOptions(
  organizationId: string,
  idToken: string,
) {
  return backendRequest<FounderChangeOptions>(
    { method: HttpMethod.Get, url: founderUrl(organizationId) },
    { idToken },
  );
}

export function changeFounder(
  organizationId: string,
  newFounderId: string,
  idToken: string,
) {
  return backendRequest<FounderChangeResult>(
    {
      method: HttpMethod.Post,
      url: founderUrl(organizationId),
      data: { newFounderId },
    },
    { idToken },
  );
}
