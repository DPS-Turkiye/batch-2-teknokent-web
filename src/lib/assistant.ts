import { getBotApiUrl, getTranscriptApiUrl } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import type { AddBotResult, TranscriptSegment } from "@/types/assistant";

export type { AddBotResult, TranscriptSegment } from "@/types/assistant";

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  const response = await httpClient.post(getBotApiUrl(), { meetingUrl });

  if (response.status < 200 || response.status >= 300) {
    const detail =
      (response.data && (response.data.detail || response.data.message)) ||
      `Bot gönderilemedi (${response.status})`;
    throw new Error(String(detail));
  }

  return response.data as AddBotResult;
}

export async function fetchTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<TranscriptSegment[]> {
  const response = await httpClient.get(
    getTranscriptApiUrl(platform, nativeMeetingId),
  );
  if (response.status < 200 || response.status >= 300) {
    const detail =
      (response.data && response.data.detail) ||
      `Transcript alınamadı (${response.status})`;
    throw new Error(String(detail));
  }
  return (response.data?.segments ?? []) as TranscriptSegment[];
}
