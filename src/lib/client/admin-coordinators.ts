import type {
  CoordinatorAccount,
  CoordinatorCandidate,
  CoordinatorSearchResult,
} from "@/interfaces/admin-coordinator";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const BASE = "/api/admin/coordinators";

export async function getCoordinatorCandidate(email: string) {
  return requireSuccess(
    await backendHttp.get<CoordinatorCandidate>(`${BASE}/candidate`, {
      params: { email },
    }),
  );
}

/** Approved coordinators whose email starts with `q`; with `programId`, those already running it are left out. */
export async function searchCoordinators(q: string, programId?: string) {
  const query = q.trim();
  return requireSuccess(
    await backendHttp.get<CoordinatorSearchResult[]>(`${BASE}/search`, {
      params: programId ? { q: query, programId } : { q: query },
    }),
  );
}

export async function addCoordinator(input: {
  fullName: string;
  email: string;
}) {
  return requireSuccess(
    await backendHttp.post<CoordinatorAccount>(BASE, input),
  );
}

export async function setCoordinatorAccess(id: string, active: boolean) {
  return requireSuccess(
    await backendHttp.put<CoordinatorAccount>(
      `${BASE}/${encodeURIComponent(id)}/access`,
      { active },
    ),
  );
}

export async function resendCoordinatorPasswordSetup(id: string) {
  return requireSuccess(
    await backendHttp.post<CoordinatorAccount>(
      `${BASE}/${encodeURIComponent(id)}/password-setup`,
    ),
  );
}
