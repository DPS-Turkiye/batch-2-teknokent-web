import type { MeetingItem } from "@/interfaces/meeting";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMeetings() {
  return requireSuccess(await httpClient.get<MeetingItem[]>("/api/meetings"));
}

export async function postMeeting(payload: Record<string, unknown>) {
  return requireSuccess(
    await httpClient.post<MeetingItem>("/api/meetings", payload),
  );
}
