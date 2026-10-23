import "server-only";

import { UserAccountStatus, type BackendUser } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export type AccountDecision = {
  user: BackendUser;
  inviteCode: string | null;
};

export function fetchUsers(options?: {
  role?: BackendUser["role"];
  status?: UserAccountStatus;
}) {
  return backendRequest<BackendUser[]>({
    method: "GET",
    url: "/api/users",
    params: {
      ...(options?.role ? { role: options.role } : {}),
      ...(options?.status ? { status: options.status } : {}),
    },
  });
}

export function fetchUser(userId: string, timeout?: number) {
  return backendRequest<BackendUser>({
    method: "GET",
    url: `/api/users/${encodeURIComponent(userId)}`,
    ...(timeout ? { timeout } : {}),
  });
}

export function decideAccountStatus(
  userId: string,
  actorId: string,
  status: UserAccountStatus.Approved | UserAccountStatus.Rejected,
) {
  return backendRequest<AccountDecision>({
    method: "PATCH",
    url: `/api/users/${encodeURIComponent(userId)}/status`,
    data: { actorId, status },
  });
}

export function revokeSignIns(userId: string, actorId: string) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Post,
    url: `/api/users/${encodeURIComponent(userId)}/sign-ins/revoke`,
    data: { actorId },
  });
}
