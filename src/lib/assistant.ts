import axios from "axios";

import {
  getBotApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import type { AddBotResult, TranscriptSegment } from "@/types/assistant";

export type { AddBotResult, TranscriptSegment } from "@/types/assistant";

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  try {
    const response = await httpClient.post(getBotApiUrl(), { meetingUrl });
    return response.data as AddBotResult;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        `Failed to send bot (${error.response?.status ?? "network error"})`;
      throw new Error(String(detail));
    }
    throw error;
  }
}

export async function stopMeetingBot(
  platform: string,
  nativeMeetingId: string,
): Promise<void> {
  try {
    await httpClient.delete(getStopBotApiUrl(platform, nativeMeetingId));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        `Failed to stop bot (${error.response?.status ?? "network error"})`;
      throw new Error(String(detail));
    }
    throw error;
  }
}

export async function fetchTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<TranscriptSegment[]> {
  try {
    const response = await httpClient.get(
      getTranscriptApiUrl(platform, nativeMeetingId),
    );
    return (response.data?.segments ?? []) as TranscriptSegment[];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail =
        error.response?.data?.detail ||
        `Failed to fetch transcript (${error.response?.status ?? "network error"})`;
      throw new Error(String(detail));
    }
    throw error;
  }
}
