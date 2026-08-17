import axios from "axios";
import { getBackendUrl } from "@/lib/const";
import { z } from "zod";

export const addBotBodySchema = z.object({
  meetingUrl: z.string().trim().url(),
});

const backendClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
});

export async function createMeetingBot(body: unknown): Promise<{
  data: unknown;
  status: number;
}> {
  const response = await backendClient.post("/api/assistant/bots", body);
  return {
    data: response.data,
    status: response.status,
  };
}
