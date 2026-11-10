import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

import { clientText } from "@/i18n/client-texts";
import { amplifyBlockedMessage } from "@/lib/amplify-safe-body";
import {
  getBotApiUrl,
  getMeetingReportApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { bearerHeader } from "@/lib/client/bearer";
import { httpClient, UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import type {
  AddBotResult,
  MeetingReport,
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
      return /\b(bad|invalid|failed|error|could|must|not found|unavailable)\b/i.test(
        data.detail,
      )
        ? fallback
        : data.detail;
    }
    if ("message" in data && typeof data.message === "string" && data.message) {
      return /\b(bad|invalid|failed|error|could|must|not found|unavailable)\b/i.test(
        data.message,
      )
        ? fallback
        : data.message;
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
        `${fallback} (${error.response?.status ?? clientText("assistant.network")})`,
      ),
    );
  }
  throw error;
}

/** The backend checks the signed-in person against the meeting, so every call carries their own token. */
async function signedIn(
  config: AxiosRequestConfig = {},
): Promise<AxiosRequestConfig> {
  return { ...config, headers: await bearerHeader() };
}

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  try {
    return requireAssistantOk(
      await httpClient.post<AddBotResult>(
        getBotApiUrl(),
        { meetingUrl },
        await signedIn(),
      ),
      clientText("assistant.sendFailed"),
    );
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.sendFailed"));
  }
}

export async function stopMeetingBot(
  platform: string,
  nativeMeetingId: string,
): Promise<void> {
  try {
    requireAssistantOk(
      await httpClient.delete(
        getStopBotApiUrl(platform, nativeMeetingId),
        await signedIn(),
      ),
      clientText("assistant.stopFailed"),
    );
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.stopFailed"));
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
        await signedIn(),
      ),
      clientText("assistant.transcriptFailed"),
    );
    return data?.segments ?? [];
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.transcriptFailed"));
  }
}

/** The backend reports on the meeting's own transcript, so no lines are sent. */
export async function generateMeetingReport(
  platform: string,
  nativeMeetingId: string,
): Promise<MeetingReport> {
  try {
    return requireAssistantOk(
      await httpClient.post<MeetingReport>(
        getMeetingReportApiUrl(platform, nativeMeetingId),
        undefined,
        await signedIn({ timeout: UPLOAD_TIMEOUT_MS }),
      ),
      clientText("assistant.reportFailed"),
    );
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.reportFailed"));
  }
}
