import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export async function fetchMeetingTranscript(
  platform: string,
  nativeMeetingId: string,
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: HttpMethod.Get,
      url: `/api/assistant/transcripts/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
