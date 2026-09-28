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
import { currentIdToken } from "@/lib/firebase/auth";

async function authConfig() {
  const token = await currentIdToken();
  if (!token) throw new Error("Oturum açmanız gerekiyor.");
  return { headers: { Authorization: `Bearer ${token}` } };
}

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
        `${fallback} (${error.response?.status ?? "ağ hatası"})`,
      ),
    );
  }
  throw error;
}

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  try {
    return requireAssistantOk(
      await httpClient.post<AddBotResult>(
        getBotApiUrl(),
        { meetingUrl },
        await authConfig(),
      ),
      "Toplantı asistanı gönderilemedi.",
    );
  } catch (error) {
    wrapAssistantError(error, "Toplantı asistanı gönderilemedi.");
  }
}

export async function fetchScheduledAssistantSession(
  meetingId: string,
): Promise<string> {
  const token = await currentIdToken();
  if (!token) throw new Error("Oturum açmanız gerekiyor.");
  try {
    const response = await httpClient.get<{ assistantSessionId: string }>(
      `/api/assistant/meetings/${encodeURIComponent(meetingId)}/session`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireAssistantOk(response, "Toplantı asistanı yüklenemedi.")
      .assistantSessionId;
  } catch (error) {
    wrapAssistantError(error, "Toplantı asistanı yüklenemedi.");
  }
}

export async function stopMeetingBot(
  assistantSessionId: string,
): Promise<void> {
  try {
    requireAssistantOk(
      await httpClient.delete(
        getStopBotApiUrl(assistantSessionId),
        await authConfig(),
      ),
      "Toplantı asistanı durdurulamadı.",
    );
  } catch (error) {
    wrapAssistantError(error, "Toplantı asistanı durdurulamadı.");
  }
}

export async function fetchTranscript(
  assistantSessionId: string,
): Promise<TranscriptSegment[]> {
  try {
    const data = requireAssistantOk(
      await httpClient.get<{ segments?: TranscriptSegment[] }>(
        getTranscriptApiUrl(assistantSessionId),
        await authConfig(),
      ),
      "Toplantı transkripti alınamadı.",
    );
    return data?.segments ?? [];
  } catch (error) {
    wrapAssistantError(error, "Toplantı transkripti alınamadı.");
  }
}

export async function generateMeetingReport(
  assistantSessionId: string,
  segments: TranscriptLine[],
): Promise<MeetingReport> {
  try {
    const body =
      segments.length > 0 && jsonFitsAmplifyWaf({ segments })
        ? { segments }
        : {};
    return requireAssistantOk(
      await httpClient.post<MeetingReport>(
        getMeetingReportApiUrl(assistantSessionId),
        body,
        { timeout: UPLOAD_TIMEOUT_MS, ...(await authConfig()) },
      ),
      "Toplantı raporu oluşturulamadı.",
    );
  } catch (error) {
    wrapAssistantError(error, "Toplantı raporu oluşturulamadı.");
  }
}
