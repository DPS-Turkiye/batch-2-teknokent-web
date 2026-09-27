import "server-only";

import type {
  CoordinatorAccount,
  CoordinatorCandidate,
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
