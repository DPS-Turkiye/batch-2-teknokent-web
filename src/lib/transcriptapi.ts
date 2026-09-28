import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export async function fetchMeetingTranscript(
  sessionId: string,
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: "GET",
      url: `/api/assistant/sessions/${encodeURIComponent(sessionId)}/transcript`,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
