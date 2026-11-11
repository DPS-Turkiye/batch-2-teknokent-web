import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetingBotState } from "@/hooks/use-meeting-bot-state";
import { MeetingBotState } from "@/interfaces/meeting-bot";
import { fetchMeetingBotStatus } from "@/lib/assistant";
import { BOT_ADMISSION_WARNING_MS } from "@/lib/meeting-bot";
import {
  MeetingBotNotice,
  MeetingBotNoticeTone,
  MeetingPlatform,
  MeetingStatus,
  type Meeting,
} from "@/types/assistant";
import { BOT_REQUESTED_AT, meetingBotStatus } from "@test/fixtures/meeting-bot";
import { queryWrapper } from "@test/fixtures/query-wrapper";
import { freezeDate } from "@test/test-utils";

vi.mock("@/lib/assistant", () => ({ fetchMeetingBotStatus: vi.fn() }));

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: "m1",
    title: "Yatırım görüşmesi",
    platform: MeetingPlatform.GoogleMeet,
    platformKey: "google_meet",
    nativeMeetingId: "abc-defg-hij",
    status: MeetingStatus.Joining,
    when: "Şimdi",
    participants: [],
    ...overrides,
  };
}

function at(msAfterSend: number) {
  freezeDate(
    new Date(Date.parse(BOT_REQUESTED_AT) + msAfterSend).toISOString(),
  );
}

describe("useMeetingBotState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks the host to admit a bot waiting in the lobby", async () => {
    at(30_000);
    vi.mocked(fetchMeetingBotStatus).mockResolvedValue(meetingBotStatus());

    const { result } = renderHook(() => useMeetingBotState(meeting()), {
      wrapper: queryWrapper().wrapper,
    });

    await waitFor(() =>
      expect(result.current.botNotice).toBe(
        MeetingBotNotice.WaitingForAdmission,
      ),
    );
    expect(result.current.botNoticeTone).toBe(MeetingBotNoticeTone.Info);
    expect(fetchMeetingBotStatus).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
    );
  });

  it("warns when the bot has waited in the lobby too long", async () => {
    at(BOT_ADMISSION_WARNING_MS + 1_000);
    vi.mocked(fetchMeetingBotStatus).mockResolvedValue(meetingBotStatus());

    const { result } = renderHook(() => useMeetingBotState(meeting()), {
      wrapper: queryWrapper().wrapper,
    });

    await waitFor(() =>
      expect(result.current.botNotice).toBe(MeetingBotNotice.WaitingTooLong),
    );
    expect(result.current.botNoticeTone).toBe(MeetingBotNoticeTone.Danger);
  });

  it("says the bot is recording once it is in the meeting", async () => {
    vi.mocked(fetchMeetingBotStatus).mockResolvedValue(
      meetingBotStatus({ state: MeetingBotState.Active }),
    );

    const { result } = renderHook(() => useMeetingBotState(meeting()), {
      wrapper: queryWrapper().wrapper,
    });

    await waitFor(() =>
      expect(result.current.botNotice).toBe(MeetingBotNotice.Recording),
    );
    expect(result.current.botNoticeTone).toBe(MeetingBotNoticeTone.Success);
  });

  it("says nothing when the bot's state cannot be read", async () => {
    vi.mocked(fetchMeetingBotStatus).mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useMeetingBotState(meeting()), {
      wrapper: queryWrapper().wrapper,
    });

    await waitFor(() => expect(fetchMeetingBotStatus).toHaveBeenCalled());
    expect(result.current.botNotice).toBeNull();
  });

  it.each([
    ["a completed meeting", meeting({ status: MeetingStatus.Completed })],
    ["a meeting without a Meet code", meeting({ nativeMeetingId: "" })],
    ["no meeting", null],
  ])("does not ask about %s", (_label, selected) => {
    const { result } = renderHook(() => useMeetingBotState(selected), {
      wrapper: queryWrapper().wrapper,
    });

    expect(result.current.botNotice).toBeNull();
    expect(fetchMeetingBotStatus).not.toHaveBeenCalled();
  });
});
