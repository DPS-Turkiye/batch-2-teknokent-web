import type {
  CoordinatorAccount,
  CoordinatorCandidate,
  CoordinatorSearchResult,
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

export async function searchCoordinators(q: string, programId?: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorSearchResult[]>(`${BASE}/search`, {
      params: programId ? { q, programId } : { q },
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

export async function resendCoordinatorPasswordSetup(id: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorAccount>(
      `${BASE}/${encodeURIComponent(id)}/password-setup`,
      {},
    ),
  );
}
