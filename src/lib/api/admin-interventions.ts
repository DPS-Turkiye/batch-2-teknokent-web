import "server-only";

import type { AdminIntervention } from "@/interfaces/admin-intervention";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/admin/interventions";

export function fetchAdminInterventions(actorId: string) {
  return backendRequest<AdminIntervention[]>({
    method: "GET",
    url: BASE,
    params: { actorId },
  });
}

export function openAdminIntervention(
  actorId: string,
  input: { mentorshipId: string; action: string; note: string },
) {
  return backendRequest<AdminIntervention>({
    method: "POST",
    url: BASE,
    data: { ...input, actorId },
  });
}

export function resolveAdminIntervention(actorId: string, id: string) {
  return backendRequest<AdminIntervention>({
    method: "PUT",
    url: `${BASE}/${encodeURIComponent(id)}/resolve`,
    data: { actorId },
  });
}
