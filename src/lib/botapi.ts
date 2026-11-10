import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export async function createMeetingBot(
  body: { meetingUrl: string },
  idToken: string,
): Promise<{
  data: unknown;
  status: number;
}> {
  const response = await backendRequest(
    {
      method: HttpMethod.Post,
      url: "/api/assistant/bots",
      data: body,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}

export async function stopMeetingBotBackend(
  platform: string,
  nativeMeetingId: string,
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: HttpMethod.Delete,
      url: `/api/assistant/bots/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}

/** The backend reads the meeting's own transcript and picks the model, so nothing else is sent. */
export async function generateMeetingReportBackend(
  platform: string,
  nativeMeetingId: string,
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: HttpMethod.Post,
      url: `/api/assistant/bots/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}/report`,
      timeout: 120000,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
