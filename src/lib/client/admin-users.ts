import type { BackendUser, UserAccountStatus } from "@/interfaces/session";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export type AccountDecision = {
  user: BackendUser;
  inviteCode: string | null;
};

export async function getPendingAccounts() {
  return requireSuccess(await httpClient.get<BackendUser[]>("/api/users"));
}

export async function decidePendingAccount(
  userId: string,
  status: UserAccountStatus.Approved | UserAccountStatus.Rejected,
) {
  return requireSuccess(
    await httpClient.patch<AccountDecision>(
      `/api/users/${encodeURIComponent(userId)}/status`,
      { status },
    ),
  );
}

export async function revokeUserSignIns(userId: string) {
  return requireSuccess(
    await httpClient.post<BackendUser>(
      `/api/users/${encodeURIComponent(userId)}/sign-ins/revoke`,
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
