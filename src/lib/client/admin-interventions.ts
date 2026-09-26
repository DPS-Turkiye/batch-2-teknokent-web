import type { AdminIntervention } from "@/interfaces/admin-intervention";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const BASE = "/api/admin/interventions";

export async function listAdminInterventions() {
  return requireSuccess(await httpClient.get<AdminIntervention[]>(BASE));
}

export async function openAdminIntervention(input: {
  mentorshipId: string;
  action: string;
  note: string;
}) {
  return requireSuccess(await httpClient.post<AdminIntervention>(BASE, input));
}

export async function resolveAdminIntervention(id: string) {
  return requireSuccess(
    await httpClient.put<AdminIntervention>(
      `${BASE}/${encodeURIComponent(id)}/resolve`,
      {},
    ),
  );
}
