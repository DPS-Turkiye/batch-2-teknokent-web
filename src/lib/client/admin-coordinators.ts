import type {
  CoordinatorAccount,
  CoordinatorCandidate,
} from "@/interfaces/admin-coordinator";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const BASE = "/api/admin/coordinators";

export async function getCoordinatorCandidate(email: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorCandidate>(`${BASE}/candidate`, {
      params: { email },
    }),
  );
}

export async function addCoordinator(input: {
  fullName: string;
  email: string;
}) {
  return requireSuccess(await httpClient.post<CoordinatorAccount>(BASE, input));
}

export async function setCoordinatorAccess(id: string, active: boolean) {
  return requireSuccess(
    await httpClient.put<CoordinatorAccount>(
      `${BASE}/${encodeURIComponent(id)}/access`,
      { active },
    ),
  );
}
