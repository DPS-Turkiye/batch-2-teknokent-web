import type { AdminIntervention } from "@/interfaces/admin-intervention";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const BASE = "/api/admin/interventions";

export async function listAdminInterventions() {
  return requireSuccess(await backendHttp.get<AdminIntervention[]>(BASE));
}

export async function openAdminIntervention(input: {
  mentorshipId: string;
  action: string;
  note: string;
}) {
  return requireSuccess(await backendHttp.post<AdminIntervention>(BASE, input));
}

export async function resolveAdminIntervention(id: string) {
  return requireSuccess(
    await backendHttp.put<AdminIntervention>(
      `${BASE}/${encodeURIComponent(id)}/resolve`,
    ),
  );
}
