import {
  MeetingBotEndReason,
  MeetingBotState,
  type MeetingBotStatus,
} from "@/interfaces/meeting-bot";
import { isEnumValue } from "@/lib/enum";
import { POLL_INTERVAL } from "@/lib/poll";
import { MeetingBotNotice, MeetingBotNoticeTone } from "@/types/assistant";

/**
 * Google drops some guest bots right after "Ask to join" without telling them, so a bot that is still "waiting"
 * this long after it was sent most likely never reached the host's admit prompt.
 */
export const BOT_ADMISSION_WARNING_MS = 2 * 60_000;
export const BOT_ADMISSION_WARNING_MINUTES = BOT_ADMISSION_WARNING_MS / 60_000;

const LIVE_STATES: readonly MeetingBotState[] = [
  MeetingBotState.Requested,
  MeetingBotState.Joining,
  MeetingBotState.WaitingForAdmission,
  MeetingBotState.Active,
  MeetingBotState.NeedsHelp,
  MeetingBotState.Stopping,
];

/** A bot in these states can still change on its own, so it is worth checking often. */
export function isMeetingBotLive(state: MeetingBotState | undefined): boolean {
  return state !== undefined && LIVE_STATES.includes(state);
}

/**
 * How often to ask about the bot: often while it can still change on its own, less often once it is settled, but
 * still often enough that a bot sent again shows up within seconds.
 */
export function meetingBotPollMs(state: MeetingBotState | undefined): number {
  return isMeetingBotLive(state) ? POLL_INTERVAL.chat : POLL_INTERVAL.messages;
}

/** The backend's bot state, or null when the answer is not one. */
export function parseMeetingBotStatus(data: unknown): MeetingBotStatus | null {
  if (!data || typeof data !== "object") return null;
  if (!("state" in data) || !isEnumValue(MeetingBotState, data.state)) {
    return null;
  }
  const endReason =
    "endReason" in data && isEnumValue(MeetingBotEndReason, data.endReason)
      ? data.endReason
      : null;
  const requestedAt =
    "requestedAt" in data && typeof data.requestedAt === "string"
      ? data.requestedAt
      : null;
  return {
    platform:
      "platform" in data && typeof data.platform === "string"
        ? data.platform
        : "",
    nativeMeetingId:
      "nativeMeetingId" in data && typeof data.nativeMeetingId === "string"
        ? data.nativeMeetingId
        : "",
    state: data.state,
    endReason,
    requestedAt,
  };
}

function waitedTooLong(requestedAt: string | null, now: number): boolean {
  if (!requestedAt) return false;
  const sentAt = Date.parse(requestedAt);
  return Number.isFinite(sentAt) && now - sentAt >= BOT_ADMISSION_WARNING_MS;
}

function endedNotice(reason: MeetingBotEndReason | null): MeetingBotNotice {
  switch (reason) {
    case MeetingBotEndReason.NotAdmittedInTime:
      return MeetingBotNotice.NotAdmittedInTime;
    case MeetingBotEndReason.Rejected:
      return MeetingBotNotice.Rejected;
    case MeetingBotEndReason.Stopped:
    case MeetingBotEndReason.LeftAlone:
      return MeetingBotNotice.Left;
    case MeetingBotEndReason.JoinFailed:
    case MeetingBotEndReason.Other:
    case null:
      return MeetingBotNotice.CouldNotJoin;
  }
}

/**
 * What to tell the user about the bot at `now` (epoch ms, the browser clock; a fast clock only shows the wait
 * warning a little early), or null when there is no bot to talk about.
 */
export function meetingBotNotice(
  status: MeetingBotStatus | null,
  now: number,
): MeetingBotNotice | null {
  if (!status) return null;
  switch (status.state) {
    case MeetingBotState.None:
      return null;
    case MeetingBotState.Requested:
    case MeetingBotState.Joining:
      return MeetingBotNotice.Joining;
    case MeetingBotState.WaitingForAdmission:
      return waitedTooLong(status.requestedAt, now)
        ? MeetingBotNotice.WaitingTooLong
        : MeetingBotNotice.WaitingForAdmission;
    case MeetingBotState.Active:
      return MeetingBotNotice.Recording;
    case MeetingBotState.NeedsHelp:
      return MeetingBotNotice.CouldNotJoin;
    case MeetingBotState.Stopping:
    case MeetingBotState.Completed:
      return MeetingBotNotice.Left;
    case MeetingBotState.Failed:
      return endedNotice(status.endReason);
  }
}

export function meetingBotNoticeTone(
  notice: MeetingBotNotice,
): MeetingBotNoticeTone {
  switch (notice) {
    case MeetingBotNotice.Recording:
      return MeetingBotNoticeTone.Success;
    case MeetingBotNotice.Joining:
    case MeetingBotNotice.WaitingForAdmission:
    case MeetingBotNotice.Left:
      return MeetingBotNoticeTone.Info;
    case MeetingBotNotice.WaitingTooLong:
    case MeetingBotNotice.CouldNotJoin:
    case MeetingBotNotice.NotAdmittedInTime:
    case MeetingBotNotice.Rejected:
      return MeetingBotNoticeTone.Danger;
  }
}
