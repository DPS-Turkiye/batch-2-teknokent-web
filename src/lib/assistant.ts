import { getBotApiUrl, getTranscriptApiUrl } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import type { AddBotResult, TranscriptSegment } from "@/types/assistant";

export type { AddBotResult, TranscriptSegment } from "@/types/assistant";
//frontend helper functionları
//bot
export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  const response = await httpClient.post(getBotApiUrl(), { meetingUrl }); //POST /api/botapi dan dolayı botapi ya gider

  if (response.status < 200 || response.status >= 300) {
    const detail =
      (response.data && (response.data.detail || response.data.message)) ||
      `Bot gönderilemedi (${response.status})`;
    throw new Error(String(detail));
  }

  return response.data as AddBotResult;
}

//transkript
export async function fetchTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<TranscriptSegment[]> {
  const response = await httpClient.get(   //GET /api/transcriptapi?platform=google_meet&nativeMeetingId=hhz-tdnu-ksz,yani transkriptapi ya gidiyor.
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
