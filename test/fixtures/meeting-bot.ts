import {
  MeetingBotState,
  type MeetingBotStatus,
} from "@/interfaces/meeting-bot";

export const BOT_REQUESTED_AT = "2026-11-11T20:03:06Z";

export function meetingBotStatus(
  overrides: Partial<MeetingBotStatus> = {},
): MeetingBotStatus {
  return {
    platform: "google_meet",
    nativeMeetingId: "abc-defg-hij",
    state: MeetingBotState.WaitingForAdmission,
    endReason: null,
    requestedAt: BOT_REQUESTED_AT,
    ...overrides,
  };
}
