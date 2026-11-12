import "server-only";

import type {
  CoordinatorAccount,
  CoordinatorCandidate,
  CoordinatorSearchResult,
} from "@/interfaces/admin-coordinator";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/admin/coordinators";

export function fetchCoordinatorCandidate(actorId: string, email: string) {
  return backendRequest<CoordinatorCandidate>({
    method: "GET",
    url: `${BASE}/candidate`,
    params: { actorId, email },
  });
}

/** Approved coordinators whose email starts with `q`; with `programId`, those already running it are left out. */
export function searchCoordinators(
  actorId: string,
  query: { q: string; programId?: string | undefined },
) {
  return backendRequest<CoordinatorSearchResult[]>({
    method: "GET",
    url: `${BASE}/search`,
    params: { actorId, ...query },
  });
}

export function addCoordinator(
  actorId: string,
  input: { fullName: string; email: string },
) {
  return backendRequest<CoordinatorAccount>({
    method: "POST",
    url: BASE,
    data: { ...input, actorId },
  });
}

export function setCoordinatorAccess(
  actorId: string,
  id: string,
  active: boolean,
) {
  return backendRequest<CoordinatorAccount>({
    method: "PUT",
    url: `${BASE}/${encodeURIComponent(id)}/access`,
    data: { actorId, active },
  });
}

export function resendCoordinatorPasswordSetup(actorId: string, id: string) {
  return backendRequest<CoordinatorAccount>({
    method: "POST",
    url: `${BASE}/${encodeURIComponent(id)}/password-setup`,
    params: { actorId },
  });
}
