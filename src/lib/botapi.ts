import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export async function createMeetingBot(body: unknown): Promise<{
  data: unknown;
  status: number;
}> {
  const response = await backendRequest({
    method: "POST",
    url: "/api/assistant/bots",
    data: body,
  });
  return {
    data: response.data,
    status: response.status,
  };
}

export async function stopMeetingBotBackend(
  platform: string,
  nativeMeetingId: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest({
    method: "DELETE",
    url: `/api/assistant/bots/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
  });
  return {
    data: response.data,
    status: response.status,
  };
}

export async function generateMeetingReportBackend(
  platform: string,
  nativeMeetingId: string,
  body: { model?: string; segments?: unknown[] },
): Promise<{ data: unknown; status: number }> {
  const response = await backendRequest({
    method: "POST",
    url: `/api/assistant/bots/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}/report`,
    data: body,
    timeout: 120000,
  });
  return {
    data: response.data,
    status: response.status,
  };
}
