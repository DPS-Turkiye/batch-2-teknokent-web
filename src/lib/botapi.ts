import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export async function createMeetingBot(
  body: unknown,
  idToken: string,
): Promise<{
  data: unknown;
  status: number;
}> {
  const response = await backendRequest(
    { method: "POST", url: "/api/assistant/sessions", data: body },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}

export async function getMeetingAssistantSession(
  meetingId: string,
  idToken: string,
) {
  const response = await backendRequest<{ assistantSessionId: string }>(
    {
      method: "GET",
      url: `/api/assistant/meetings/${encodeURIComponent(meetingId)}/session`,
    },
    { idToken },
  );
  return { data: response.data, status: response.status };
}

export async function stopMeetingBotBackend(
  sessionId: string,
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: "DELETE",
      url: `/api/assistant/sessions/${encodeURIComponent(sessionId)}`,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}

export async function generateMeetingReportBackend(
  sessionId: string,
  body: { model?: string; segments?: unknown[] },
  idToken: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest(
    {
      method: "POST",
      url: `/api/assistant/sessions/${encodeURIComponent(sessionId)}/report`,
      data: body,
      timeout: 120000,
    },
    { idToken },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
