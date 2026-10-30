import { UserAccountStatus, type BackendUser } from "@/interfaces/session";
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
