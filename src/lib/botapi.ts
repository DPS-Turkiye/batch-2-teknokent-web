import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export async function createMeetingBot(body: unknown): Promise<{
  data: unknown;
  status: number;
}> {
  const response = await backendRequest(
    { method: "POST", url: "/api/assistant/bots", data: body },
    { authenticated: false },
  );
  return {
    data: response.data,
    status: response.status,
  };
}
