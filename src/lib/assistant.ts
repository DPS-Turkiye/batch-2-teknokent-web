import axios, { type AxiosResponse } from "axios";

import {
  amplifyBlockedMessage,
  jsonFitsAmplifyWaf,
} from "@/lib/amplify-safe-body";
import {
  getBotApiUrl,
  getMeetingReportApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { httpClient, UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import type {
  AddBotResult,
  MeetingReport,
  TranscriptLine,
  TranscriptSegment,
} from "@/types/assistant";

export type {
  AddBotResult,
  MeetingReport,
  TranscriptSegment,
} from "@/types/assistant";

function readAssistantError(data: unknown, fallback: string): string {
  const blocked = amplifyBlockedMessage(data);
  if (blocked) return blocked;
  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string" && data.detail) {
      return data.detail;
    }
    if ("message" in data && typeof data.message === "string" && data.message) {
      return data.message;
    }
  }
  return fallback;
}

function requireAssistantOk<T>(
  response: AxiosResponse<T>,
  fallback: string,
): T {
  if (response.status >= 200 && response.status < 300) return response.data;
  throw new Error(
    readAssistantError(response.data, `${fallback} (${response.status})`),
  );
}

function wrapAssistantError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    throw new Error(
      readAssistantError(
        error.response?.data,
        `${fallback} (${error.response?.status ?? "network error"})`,
      ),
    );
  }
  throw error;
}

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  try {
    return requireAssistantOk(
      await httpClient.post<AddBotResult>(getBotApiUrl(), { meetingUrl }),
      "Failed to send bot",
    );
  } catch (error) {
    wrapAssistantError(error, "Failed to send bot");
  }
}

export async function stopMeetingBot(
  platform: string,
  nativeMeetingId: string,
): Promise<void> {
  try {
    requireAssistantOk(
      await httpClient.delete(getStopBotApiUrl(platform, nativeMeetingId)),
      "Failed to stop bot",
    );
  } catch (error) {
    wrapAssistantError(error, "Failed to stop bot");
  }
}

export async function fetchTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<TranscriptSegment[]> {
  try {
    const data = requireAssistantOk(
      await httpClient.get<{ segments?: TranscriptSegment[] }>(
        getTranscriptApiUrl(platform, nativeMeetingId),
      ),
      "Failed to fetch transcript",
    );
    return data?.segments ?? [];
  } catch (error) {
    wrapAssistantError(error, "Failed to fetch transcript");
  }
}

export async function generateMeetingReport(
  platform: string,
  nativeMeetingId: string,
  segments: TranscriptLine[],
): Promise<MeetingReport> {
  try {
    const body =
      segments.length > 0 && jsonFitsAmplifyWaf({ segments })
        ? { segments }
        : {};
    return requireAssistantOk(
      await httpClient.post<MeetingReport>(
        getMeetingReportApiUrl(platform, nativeMeetingId),
        body,
        { timeout: UPLOAD_TIMEOUT_MS },
      ),
      "Failed to generate meeting report",
    );
  } catch (error) {
    wrapAssistantError(error, "Failed to generate meeting report");
  }
}
