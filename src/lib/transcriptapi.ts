import axios from "axios";
import { z } from "zod";
import { getBackendUrl } from "@/lib/const";

export const transcriptQuerySchema = z.object({
  platform: z.string().trim().min(1),
  nativeMeetingId: z.string().trim().min(1),
});

const backendClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    Accept: "application/json",
  },
  validateStatus: () => true,
});

export async function fetchMeetingTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<{ data: unknown; status: number }> {
  const response = await backendClient.get(
    `/api/assistant/transcripts/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
  );
  return {
    data: response.data,
    status: response.status,
  };
}
