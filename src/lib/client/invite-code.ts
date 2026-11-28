import type { InviteCodeCheck } from "@/interfaces/invite-code";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

/** /invite checks the code before any login exists; the backend answers only valid and the team's name. */
export async function checkInviteCode(code: string) {
  return requireSuccess(
    await backendHttp.post<InviteCodeCheck>("/api/auth/invite-code/check", {
      code: code.trim(),
    }),
  );
}
