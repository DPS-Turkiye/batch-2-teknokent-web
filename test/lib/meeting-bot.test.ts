import { describe, expect, it } from "vitest";

import { MeetingBotEndReason, MeetingBotState } from "@/interfaces/meeting-bot";
import {
  BOT_ADMISSION_WARNING_MS,
  isMeetingBotLive,
  meetingBotNotice,
  meetingBotNoticeTone,
  meetingBotPollMs,
  parseMeetingBotStatus,
} from "@/lib/meeting-bot";
import { POLL_INTERVAL } from "@/lib/poll";
import { MeetingBotNotice, MeetingBotNoticeTone } from "@/types/assistant";
import { BOT_REQUESTED_AT, meetingBotStatus } from "@test/fixtures/meeting-bot";

const SENT = Date.parse(BOT_REQUESTED_AT);

describe("parseMeetingBotStatus", () => {
  it("reads the backend's answer", () => {
    expect(
      parseMeetingBotStatus({
        platform: "google_meet",
        nativeMeetingId: "abc-defg-hij",
        state: "FAILED",
        endReason: "JOIN_FAILED",
        requestedAt: BOT_REQUESTED_AT,
      }),
    ).toEqual(
      meetingBotStatus({
        state: MeetingBotState.Failed,
        endReason: MeetingBotEndReason.JoinFailed,
      }),
    );
  });

  it("drops an unknown end reason and a missing time", () => {
    expect(
      parseMeetingBotStatus({ state: "ACTIVE", endReason: "SOMETHING" }),
    ).toEqual({
      platform: "",
      nativeMeetingId: "",
      state: MeetingBotState.Active,
      endReason: null,
      requestedAt: null,
    });
  });

  it.each([null, "ACTIVE", {}, { state: "active" }, { segments: [] }])(
    "refuses %j",
    (data) => {
      expect(parseMeetingBotStatus(data)).toBeNull();
    },
  );
});

describe("meetingBotNotice", () => {
  it("says nothing without a bot", () => {
    expect(meetingBotNotice(null, SENT)).toBeNull();
    expect(
      meetingBotNotice(meetingBotStatus({ state: MeetingBotState.None }), SENT),
    ).toBeNull();
  });

  it.each([
    [MeetingBotState.Requested, MeetingBotNotice.Joining],
    [MeetingBotState.Joining, MeetingBotNotice.Joining],
    [MeetingBotState.Active, MeetingBotNotice.Recording],
    [MeetingBotState.NeedsHelp, MeetingBotNotice.CouldNotJoin],
    [MeetingBotState.Stopping, MeetingBotNotice.Left],
    [MeetingBotState.Completed, MeetingBotNotice.Left],
  ])("maps %s to %s", (state, notice) => {
    expect(meetingBotNotice(meetingBotStatus({ state }), SENT)).toBe(notice);
  });

  it("asks the host to admit a bot in the lobby", () => {
    expect(
      meetingBotNotice(meetingBotStatus(), SENT + BOT_ADMISSION_WARNING_MS - 1),
    ).toBe(MeetingBotNotice.WaitingForAdmission);
  });

  it("warns once the bot has waited too long to be admitted", () => {
    expect(
      meetingBotNotice(meetingBotStatus(), SENT + BOT_ADMISSION_WARNING_MS),
    ).toBe(MeetingBotNotice.WaitingTooLong);
  });

  it("keeps asking to admit when the send time is unknown", () => {
    expect(
      meetingBotNotice(meetingBotStatus({ requestedAt: null }), SENT * 2),
    ).toBe(MeetingBotNotice.WaitingForAdmission);
    expect(
      meetingBotNotice(meetingBotStatus({ requestedAt: "soon" }), SENT * 2),
    ).toBe(MeetingBotNotice.WaitingForAdmission);
  });

  it.each([
    [MeetingBotEndReason.NotAdmittedInTime, MeetingBotNotice.NotAdmittedInTime],
    [MeetingBotEndReason.Rejected, MeetingBotNotice.Rejected],
    [MeetingBotEndReason.Stopped, MeetingBotNotice.Left],
    [MeetingBotEndReason.LeftAlone, MeetingBotNotice.Left],
    [MeetingBotEndReason.JoinFailed, MeetingBotNotice.CouldNotJoin],
    [MeetingBotEndReason.Other, MeetingBotNotice.CouldNotJoin],
    [null, MeetingBotNotice.CouldNotJoin],
  ])("explains a failed bot that ended with %s", (endReason, notice) => {
    expect(
      meetingBotNotice(
        meetingBotStatus({ state: MeetingBotState.Failed, endReason }),
        SENT,
      ),
    ).toBe(notice);
  });
});

describe("meetingBotNoticeTone", () => {
  it.each([
    [MeetingBotNotice.Recording, MeetingBotNoticeTone.Success],
    [MeetingBotNotice.Joining, MeetingBotNoticeTone.Info],
    [MeetingBotNotice.WaitingForAdmission, MeetingBotNoticeTone.Info],
    [MeetingBotNotice.Left, MeetingBotNoticeTone.Info],
    [MeetingBotNotice.WaitingTooLong, MeetingBotNoticeTone.Danger],
    [MeetingBotNotice.CouldNotJoin, MeetingBotNoticeTone.Danger],
    [MeetingBotNotice.NotAdmittedInTime, MeetingBotNoticeTone.Danger],
    [MeetingBotNotice.Rejected, MeetingBotNoticeTone.Danger],
  ])("colours %s as %s", (notice, tone) => {
    expect(meetingBotNoticeTone(notice)).toBe(tone);
  });
});

describe("meetingBotPollMs", () => {
  it("checks a live bot often", () => {
    expect(meetingBotPollMs(MeetingBotState.WaitingForAdmission)).toBe(
      POLL_INTERVAL.chat,
    );
  });

  it("checks a settled or unknown bot less often", () => {
    expect(meetingBotPollMs(MeetingBotState.Failed)).toBe(
      POLL_INTERVAL.messages,
    );
    expect(meetingBotPollMs(undefined)).toBe(POLL_INTERVAL.messages);
  });
});

describe("isMeetingBotLive", () => {
  it("is true while the bot can still change on its own", () => {
    expect(isMeetingBotLive(MeetingBotState.WaitingForAdmission)).toBe(true);
    expect(isMeetingBotLive(MeetingBotState.NeedsHelp)).toBe(true);
  });

  it("is false for a finished, missing or unknown bot", () => {
    expect(isMeetingBotLive(MeetingBotState.Failed)).toBe(false);
    expect(isMeetingBotLive(MeetingBotState.None)).toBe(false);
    expect(isMeetingBotLive(undefined)).toBe(false);
  });
});
