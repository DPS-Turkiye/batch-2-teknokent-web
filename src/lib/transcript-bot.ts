import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { TRANSCRIPT_BOT_LEAD_MS } from "@/lib/const";

export type TranscriptBotAction = {
  meetingId: string;
  meetLink: string;
  delayMs: number;
  alreadyDispatched: boolean;
};

function isScheduled(status: MeetingItem["status"]): boolean {
  return status === MeetingStatus.Scheduled || status === "SCHEDULED";
}

export function isTranscriptBotDue(
  meeting: MeetingItem,
  now = Date.now(),
): boolean {
  const action = transcriptBotActionFor(meeting, now);
  return action != null && action.delayMs === 0;
}

export function nextTranscriptBotAction(
  meetings: MeetingItem[],
  now = Date.now(),
): TranscriptBotAction | null {
  let best: TranscriptBotAction | null = null;
  for (const meeting of meetings) {
    const action = transcriptBotActionFor(meeting, now);
    if (!action || action.alreadyDispatched) continue;
    if (!best || action.delayMs < best.delayMs) best = action;
  }
  return best;
}

function transcriptBotActionFor(
  meeting: MeetingItem,
  now: number,
): TranscriptBotAction | null {
  const meetLink = meeting.meetLink?.trim();
  if (
    !meeting.transcribeRequested ||
    !meetLink ||
    !isScheduled(meeting.status)
  ) {
    return null;
  }
  const start = Date.parse(meeting.scheduledAt);
  if (Number.isNaN(start)) return null;
  const end = start + meeting.durationMinutes * 60_000;
  if (now > end) return null;
  return {
    meetingId: meeting.id,
    meetLink,
    delayMs: Math.max(0, start - TRANSCRIPT_BOT_LEAD_MS - now),
    alreadyDispatched: Boolean(meeting.botDispatchedAt),
  };
}

export const TRANSCRIPT_BOT_FULL_EVENT = "menton:transcript-bot-full";

/** The backend turns the bot off when its slot is already full, so compare what was asked with what was saved. */
export function announceDroppedTranscriptBot<
  T extends { transcribeRequested?: boolean },
>(requested: unknown, saved: T): T {
  if (
    requested === true &&
    saved.transcribeRequested === false &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(new Event(TRANSCRIPT_BOT_FULL_EVENT));
  }
  return saved;
}
