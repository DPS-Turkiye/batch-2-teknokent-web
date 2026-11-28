import type { RealtimeToken } from "@/interfaces/meeting-note";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { REALTIME_TOKEN_API_PATH } from "@/lib/const";

/** A short-lived token for the shared note's socket, always for the signed-in caller and their own team. */
export async function postRealtimeToken() {
  return requireSuccess(
    await backendHttp.post<RealtimeToken>(REALTIME_TOKEN_API_PATH),
  );
}
