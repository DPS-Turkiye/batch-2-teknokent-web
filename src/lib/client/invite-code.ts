import type { InviteCodeCheck } from "@/interfaces/invite-code";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function checkInviteCode(code: string) {
  return requireSuccess(
    await httpClient.post<InviteCodeCheck>("/api/auth/invite-code", { code }),
  );
}
