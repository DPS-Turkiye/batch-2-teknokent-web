import "server-only";

import type { BackendUser } from "@/interfaces/session";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchUsers(role?: BackendUser["role"]) {
  return backendRequest<BackendUser[]>({
    method: "GET",
    url: "/api/users",
    params: role ? { role } : undefined,
  });
}

export function fetchUser(userId: string) {
  return backendRequest<BackendUser>({
    method: "GET",
    url: `/api/users/${encodeURIComponent(userId)}`,
  });
}
