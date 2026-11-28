import { UserAccountStatus, type BackendUser } from "@/interfaces/session";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

export type AccountDecision = {
  user: BackendUser;
  inviteCode: string | null;
};

/** Accounts waiting for an admin's decision; the backend answers admins only. */
export async function getPendingAccounts() {
  return requireSuccess(
    await backendHttp.get<BackendUser[]>("/api/users", {
      params: { status: UserAccountStatus.Pending },
    }),
  );
}

export async function decidePendingAccount(
  userId: string,
  status: UserAccountStatus.Approved | UserAccountStatus.Rejected,
) {
  return requireSuccess(
    await backendHttp.patch<AccountDecision>(
      `/api/users/${encodeURIComponent(userId)}/status`,
      { status },
    ),
  );
}

export async function revokeUserSignIns(userId: string) {
  return requireSuccess(
    await backendHttp.post<BackendUser>(
      `/api/users/${encodeURIComponent(userId)}/sign-ins/revoke`,
      {},
    ),
  );
}

export async function deleteUserAccount(
  userId: string,
  confirmEmail: string,
  idToken: string,
) {
  return requireSuccess(
    await httpClient.post<UserDeletionResult>(
      `/api/admin/users/${encodeURIComponent(userId)}/delete`,
      { confirmEmail },
      { headers: { Authorization: `Bearer ${idToken}` } },
    ),
  );
}
