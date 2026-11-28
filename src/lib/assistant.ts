import axios, { type AxiosResponse } from "axios";

import { clientText } from "@/i18n/client-texts";
import type { MeetingBotStatus } from "@/interfaces/meeting-bot";
import { amplifyBlockedMessage } from "@/lib/amplify-safe-body";
import { addBotBodySchema } from "@/lib/assistant-schemas";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getBotApiUrl,
  getMeetingBotApiUrl,
  getMeetingReportApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { parseMeetingBotStatus } from "@/lib/meeting-bot";
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

// The provider's own 409 (a bot is already in that meeting) passes through too, so match the cap's text.
const RECORDING_SLOTS_FULL_DETAIL = "All recording slots are in use.";

/**
 * The backend's refusal: an expired session, a meeting the caller is not part of, or one it doesn't know. Its own
 * text is English and internal, so the reader gets ours.
 */
function assistantRefusal(status: number, data: unknown): string | null {
  if (status === 401) return clientText("sessionExpired");
  if (status === 403) return clientText("assistant.meetingForbidden");
  if (status === 404) return clientText("assistant.meetingNotFound");
  if (
    status === 409 &&
    (data as { detail?: unknown } | null)?.detail ===
      RECORDING_SLOTS_FULL_DETAIL
  ) {
    return clientText("assistant.recordingSlotsFull");
  }
  return null;
}

function requireAssistantOk<T>(
  response: AxiosResponse<T>,
  fallback: string,
): T {
  if (response.status >= 200 && response.status < 300) return response.data;
  throw new Error(
    assistantRefusal(response.status, response.data) ??
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

export async function addMeetingBot(meetingUrl: string): Promise<AddBotResult> {
  const body = addBotBodySchema.safeParse({ meetingUrl });
  if (!body.success) throw new Error(clientText("assistant.sendFailed"));
  try {
    return requireAssistantOk(
      await backendHttp.post<AddBotResult>(getBotApiUrl(), body.data),
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
      await backendHttp.delete(getMeetingBotApiUrl(platform, nativeMeetingId)),
      clientText("assistant.stopFailed"),
    );
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.stopFailed"));
  }
}

export async function fetchMeetingBotStatus(
  platform: string,
  nativeMeetingId: string,
): Promise<MeetingBotStatus> {
  try {
    const status = parseMeetingBotStatus(
      requireAssistantOk(
        await backendHttp.get<unknown>(
          getMeetingBotApiUrl(platform, nativeMeetingId),
        ),
        clientText("assistant.botStateFailed"),
      ),
    );
    if (!status) throw new Error(clientText("assistant.botStateFailed"));
    return status;
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.botStateFailed"));
  }
}

export async function fetchTranscript(
  platform: string,
  nativeMeetingId: string,
): Promise<TranscriptSegment[]> {
  try {
    const data = requireAssistantOk(
      // The bot API may answer an unknown meeting with an empty body.
      await backendHttp.get<{ segments?: TranscriptSegment[] } | null>(
        getTranscriptApiUrl(platform, nativeMeetingId),
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
      await backendHttp.post<MeetingReport>(
        getMeetingReportApiUrl(platform, nativeMeetingId),
        undefined,
        { timeout: UPLOAD_TIMEOUT_MS },
      ),
      clientText("assistant.reportFailed"),
    );
  } catch (error) {
    wrapAssistantError(error, clientText("assistant.reportFailed"));
  }
}
