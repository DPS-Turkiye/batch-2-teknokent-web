import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export async function fetchMeetingTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: "GET",
      url: `/api/assistant/transcripts/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
    },
    { authenticated: false },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
