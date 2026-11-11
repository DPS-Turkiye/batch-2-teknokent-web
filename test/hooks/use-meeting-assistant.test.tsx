import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatures } from "@/hooks/use-ai-features";
import { useMeetingAssistant } from "@/hooks/use-meeting-assistant";
import {
  MeetingStatus as CalendarStatus,
  type MeetingItem,
} from "@/interfaces/meeting";
import type { MeetingAssistantShare } from "@/interfaces/meeting-note";
import {
  addMeetingBot,
  fetchTranscript,
  generateMeetingReport,
  stopMeetingBot,
} from "@/lib/assistant";
import {
  getAssistantShare,
  publishReportShare,
  publishTranscriptShare,
} from "@/lib/client/meeting-notes";
import { updateMeeting } from "@/lib/client/meetings";
import {
  BotStatus,
  MeetingStatus,
  type MeetingReport,
  type TranscriptSegment,
} from "@/types/assistant";
import { aiFeatures } from "@test/fixtures/ai-features";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { InLocale } from "@test/test-utils";

const calendar = vi.hoisted(() => ({
  meetings: [] as MeetingItem[],
  refetch: vi.fn(),
}));

vi.mock("@/hooks/use-ai-features", () => ({ useAiFeatures: vi.fn() }));
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({
    data: calendar.meetings,
    isLoading: false,
    refetch: calendar.refetch,
  }),
}));
vi.mock("@/lib/assistant", () => ({
  addMeetingBot: vi.fn(),
  fetchTranscript: vi.fn(),
  generateMeetingReport: vi.fn(),
  stopMeetingBot: vi.fn(),
}));
vi.mock("@/lib/client/meeting-notes", () => ({
  getAssistantShare: vi.fn(),
  publishReportShare: vi.fn(),
  publishTranscriptShare: vi.fn(),
}));
vi.mock("@/lib/client/meetings", () => ({ updateMeeting: vi.fn() }));

const NOW = new Date("2026-09-15T10:00:00Z");
const CODE = "abc-defg-hij";
const LINK = `https://meet.google.com/${CODE}`;

function calendarMeeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return menteeMeetingFixture({
    id: "cal-1",
    agenda: "Yatırım görüşmesi",
    meetLink: LINK,
    scheduledAt: "2026-09-15T12:00:00Z",
    durationMinutes: 60,
    status: CalendarStatus.Scheduled,
    ...overrides,
  });
}

function segment(id: string, text: string): TranscriptSegment {
  return { id, speaker: "Ayşe", text, at: "00:10" };
}

function share(
  overrides: Partial<MeetingAssistantShare> = {},
): MeetingAssistantShare {
  return {
    meetingId: "cal-1",
    transcript: null,
    transcriptPublishedAt: null,
    report: null,
    reportPublishedAt: null,
    ...overrides,
  };
}

const report: MeetingReport = {
  title: "",
  meetingDate: null,
  topic: null,
  summary: "Özet",
  topicsDiscussed: [],
  decisions: [],
  actionItems: [{ owner: null, task: "", due: null }],
  risksOrBlockers: [],
  nextSteps: [],
  model: "m",
};

/** A provider keeps the translator stable between renders, as the app's root layout does. */
function Turkish({ children }: { children: ReactNode }) {
  return <InLocale locale="tr">{children}</InLocale>;
}

function renderAssistant(meetingId?: string) {
  return renderHook(() => useMeetingAssistant(meetingId), {
    wrapper: Turkish,
  });
}

/** Lets the hook's chained promises settle under fake timers. */
async function flush(ms = 0) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

describe("useMeetingAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    calendar.meetings = [];
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
    vi.mocked(getAssistantShare).mockResolvedValue(share());
    vi.mocked(fetchTranscript).mockResolvedValue([]);
    vi.mocked(updateMeeting).mockResolvedValue(calendarMeeting());
    vi.mocked(addMeetingBot).mockResolvedValue({
      id: "bot-1",
      platform: "google_meet",
      nativeMeetingId: CODE,
      status: "joining",
      title: "Bot",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("sending the bot", () => {
    it("ignores a link that is not a URL", async () => {
      const { result } = renderAssistant();
      act(() => result.current.setMeetingUrl("toplantı linki"));

      await act(() => result.current.addBot());

      expect(addMeetingBot).not.toHaveBeenCalled();
      expect(result.current.botStatus).toBeNull();
    });

    it("adds a meeting for a link outside the calendar and opens it", async () => {
      const { result } = renderAssistant();
      act(() => result.current.setMeetingUrl(LINK));

      await act(() => result.current.addBot());

      expect(addMeetingBot).toHaveBeenCalledWith(LINK);
      expect(result.current.selected).toMatchObject({
        id: "bot-1",
        title: "Bot",
        status: MeetingStatus.Joining,
        when: "Şimdi",
      });
      expect(result.current.meetingUrl).toBe("");
      expect(result.current.botStatus).toBe(BotStatus.Ok);
      expect(updateMeeting).not.toHaveBeenCalled();

      await flush(4_000);
      expect(result.current.botStatus).toBeNull();
    });

    it("shows why the bot could not be sent, then clears the status", async () => {
      vi.mocked(addMeetingBot).mockRejectedValue(new Error("Bot meşgul."));
      const { result } = renderAssistant();
      act(() => result.current.setMeetingUrl(LINK));

      await act(() => result.current.addBot());

      expect(result.current.botStatus).toBe(BotStatus.Err);
      expect(result.current.botError).toBe("Bot meşgul.");
      await flush(5_000);
      expect(result.current.botStatus).toBeNull();
    });

    it("falls back to its own wording when the failure is not an Error", async () => {
      vi.mocked(addMeetingBot).mockRejectedValue("offline");
      const { result } = renderAssistant();
      act(() => result.current.setMeetingUrl(LINK));

      await act(() => result.current.addBot());

      expect(result.current.botError).toBe("Toplantı asistanı gönderilemedi.");
    });
  });

  describe("sending the bot to a calendar meeting on its own", () => {
    it("sends it a minute before a transcribed meeting and marks the meeting", async () => {
      calendar.meetings = [
        calendarMeeting({
          transcribeRequested: true,
          scheduledAt: "2026-09-15T10:00:30Z",
        }),
      ];

      const { result } = renderAssistant();
      await flush();

      expect(addMeetingBot).toHaveBeenCalledWith(LINK);
      expect(result.current.meetingUrl).toBe(LINK);
      expect(result.current.selected?.id).toBe("cal-1");
      expect(result.current.selected?.title).toBe("Yatırım görüşmesi");
      expect(updateMeeting).toHaveBeenCalledWith("cal-1", {
        transcriptBotDispatched: true,
      });
      expect(sessionStorage.getItem("transcript-bot-sent:cal-1")).toBe("1");
    });

    it("waits until a minute before a later meeting", async () => {
      calendar.meetings = [
        calendarMeeting({
          transcribeRequested: true,
          scheduledAt: "2026-09-15T10:10:00Z",
        }),
      ];

      renderAssistant();
      await flush(8 * 60_000);
      expect(addMeetingBot).not.toHaveBeenCalled();

      await flush(60_000);
      expect(addMeetingBot).toHaveBeenCalledTimes(1);
    });

    it("does not send a second bot after the page is opened again", async () => {
      sessionStorage.setItem("transcript-bot-sent:cal-1", "1");
      calendar.meetings = [
        calendarMeeting({
          transcribeRequested: true,
          scheduledAt: "2026-09-15T10:00:30Z",
        }),
      ];

      renderAssistant();
      await flush();

      expect(addMeetingBot).not.toHaveBeenCalled();
    });

    it("forgets the attempt when the bot cannot be sent, so it can try again", async () => {
      vi.mocked(addMeetingBot).mockRejectedValue(new Error("Bot meşgul."));
      calendar.meetings = [
        calendarMeeting({
          transcribeRequested: true,
          scheduledAt: "2026-09-15T10:00:30Z",
        }),
      ];

      const { result } = renderAssistant();
      await flush();

      expect(result.current.botError).toBe("Bot meşgul.");
      expect(sessionStorage.getItem("transcript-bot-sent:cal-1")).toBeNull();
    });

    it("keeps the bot running when the meeting row cannot be marked", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(updateMeeting).mockRejectedValue(new Error("500"));
      calendar.meetings = [
        calendarMeeting({
          transcribeRequested: true,
          scheduledAt: "2026-09-15T10:00:30Z",
        }),
      ];

      const { result } = renderAssistant();
      await flush();

      expect(result.current.botStatus).toBe(BotStatus.Ok);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe("the transcript", () => {
    it("restores the saved transcript and report of a calendar meeting", async () => {
      calendar.meetings = [
        calendarMeeting({ status: CalendarStatus.Completed }),
      ];
      vi.mocked(getAssistantShare).mockResolvedValue(
        share({
          transcript: [{ id: "s1", speaker: "Ayşe", text: "Merhaba", at: "" }],
          report,
        }),
      );

      const { result } = renderAssistant("cal-1");
      await flush();

      expect(result.current.visibleTranscript.map(({ text }) => text)).toEqual([
        "Merhaba",
      ]);
      expect(result.current.meetingReport).toMatchObject({
        title: "Toplantı raporu",
        summary: "Özet",
        actionItems: [{ owner: null, task: "", due: null }],
      });
      expect(fetchTranscript).not.toHaveBeenCalled();
    });

    it("reads the live transcript every 5 seconds while the meeting is on", async () => {
      calendar.meetings = [
        calendarMeeting({ scheduledAt: "2026-09-15T09:30:00Z" }),
      ];
      vi.mocked(fetchTranscript).mockResolvedValue([
        { id: "", speaker: "", text: "Selam", at: "00:01" },
      ]);

      const { result, unmount } = renderAssistant();
      await flush();
      expect(result.current.selected?.status).toBe(MeetingStatus.Active);
      expect(fetchTranscript).toHaveBeenCalledWith("google_meet", CODE);
      expect(result.current.visibleTranscript).toEqual([
        { id: "00:01-Selam", speaker: "Speaker", text: "Selam", at: "00:01" },
      ]);

      const calls = vi.mocked(fetchTranscript).mock.calls.length;
      await flush(5_000);
      expect(vi.mocked(fetchTranscript).mock.calls.length).toBe(calls + 1);

      unmount();
      await flush(15_000);
      expect(vi.mocked(fetchTranscript).mock.calls.length).toBe(calls + 1);
    });

    it("still reads the transcript when the saved share cannot be loaded", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      calendar.meetings = [
        calendarMeeting({ status: CalendarStatus.Completed }),
      ];
      vi.mocked(getAssistantShare).mockRejectedValue(new Error("500"));

      renderAssistant("cal-1");
      await flush();

      expect(consoleError).toHaveBeenCalled();
      expect(fetchTranscript).toHaveBeenCalledWith("google_meet", CODE);
    });

    it("lets the mentor edit and remove lines of a finished meeting only", async () => {
      calendar.meetings = [
        calendarMeeting({ status: CalendarStatus.Completed }),
      ];
      vi.mocked(fetchTranscript).mockResolvedValue([
        segment("a", "Birinci"),
        segment("b", "İkinci"),
      ]);
      const { result } = renderAssistant("cal-1");
      await flush();
      expect(result.current.canEditTranscript).toBe(true);

      act(() => result.current.updateTranscriptLine("a", { text: "Düzelt" }));
      act(() => result.current.removeTranscriptLine("b"));

      expect(result.current.visibleTranscript.map(({ text }) => text)).toEqual([
        "Düzelt",
      ]);
    });

    it("keeps the transcript of a meeting that is still on read-only", async () => {
      calendar.meetings = [
        calendarMeeting({ scheduledAt: "2026-09-15T09:30:00Z" }),
      ];
      vi.mocked(fetchTranscript).mockResolvedValue([segment("a", "Canlı")]);
      const { result } = renderAssistant();
      await flush();

      act(() => result.current.updateTranscriptLine("a", { text: "Değişti" }));
      act(() => result.current.removeTranscriptLine("a"));

      expect(result.current.canEditTranscript).toBe(false);
      expect(result.current.visibleTranscript.map(({ text }) => text)).toEqual([
        "Canlı",
      ]);
    });
  });

  describe("the report", () => {
    beforeEach(() => {
      calendar.meetings = [
        calendarMeeting({ status: CalendarStatus.Completed }),
      ];
    });

    it("writes the report on its own 4 seconds after a transcript arrives", async () => {
      vi.mocked(fetchTranscript).mockResolvedValue([segment("a", "Merhaba")]);
      vi.mocked(generateMeetingReport).mockResolvedValue(report);
      const { result } = renderAssistant("cal-1");
      await flush();
      expect(generateMeetingReport).not.toHaveBeenCalled();

      await flush(4_000);

      // The backend reads the meeting's own transcript, so no lines are sent.
      expect(generateMeetingReport).toHaveBeenCalledWith("google_meet", CODE);
      expect(result.current.meetingReport?.summary).toBe("Özet");
      expect(result.current.reportStatus).toBe(BotStatus.Ok);
    });

    it("never asks for a report, on its own or by hand, when meeting reports are switched off", async () => {
      vi.mocked(useAiFeatures).mockReturnValue(
        aiFeatures({ meetingReport: false }),
      );
      vi.mocked(fetchTranscript).mockResolvedValue([segment("a", "Merhaba")]);
      const { result } = renderAssistant("cal-1");
      await flush();
      await flush(4_000);
      act(() => result.current.regenerateReport());
      await flush();

      expect(result.current.canReport).toBe(false);
      expect(generateMeetingReport).not.toHaveBeenCalled();
      expect(result.current.reportStatus).toBeNull();
      expect(result.current.visibleTranscript).toHaveLength(1);
    });

    it("asks for a transcript first when regenerating with none", async () => {
      const { result } = renderAssistant("cal-1");
      await flush();

      act(() => result.current.regenerateReport());

      expect(result.current.reportStatus).toBe(BotStatus.Err);
      expect(result.current.reportError).toBe(
        "Rapor için önce transkript gerekli.",
      );
      expect(generateMeetingReport).not.toHaveBeenCalled();
      await flush(6_000);
      expect(result.current.reportStatus).toBeNull();
    });

    it("shows why the report failed and lets it be tried again", async () => {
      vi.mocked(fetchTranscript).mockResolvedValue([segment("a", "Merhaba")]);
      vi.mocked(generateMeetingReport).mockRejectedValueOnce("timeout");
      const { result } = renderAssistant("cal-1");
      await flush();
      await flush(4_000);

      expect(result.current.reportError).toBe(
        "Toplantı raporu oluşturulamadı.",
      );

      vi.mocked(generateMeetingReport).mockResolvedValue(report);
      act(() => result.current.regenerateReport());
      await flush();
      expect(result.current.meetingReport?.summary).toBe("Özet");
    });
  });

  describe("publishing to the notebook", () => {
    beforeEach(() => {
      calendar.meetings = [
        calendarMeeting({ status: CalendarStatus.Completed }),
      ];
      vi.mocked(getAssistantShare).mockResolvedValue(
        share({
          transcript: [
            { id: "a", speaker: "Ayşe", text: "Merhaba", at: "" },
            { id: "b", speaker: "Ayşe", text: "  ", at: "" },
          ],
          report,
        }),
      );
    });

    it("sends only the transcript lines that have text", async () => {
      vi.mocked(publishTranscriptShare).mockResolvedValue(share());
      const { result } = renderAssistant("cal-1");
      await flush();

      await act(() => result.current.sendTranscript());

      expect(publishTranscriptShare).toHaveBeenCalledWith("cal-1", [
        { id: "a", speaker: "Ayşe", text: "Merhaba", at: "" },
      ]);
      expect(result.current.shareStatus).toBe(BotStatus.Ok);
    });

    it("shows why the transcript could not be sent", async () => {
      vi.mocked(publishTranscriptShare).mockRejectedValue("offline");
      const { result } = renderAssistant("cal-1");
      await flush();

      await act(() => result.current.sendTranscript());

      expect(result.current.shareStatus).toBe(BotStatus.Err);
      expect(result.current.shareError).toBe("Transkript gönderilemedi.");
    });

    it("sends the report, and shows why when it fails", async () => {
      vi.mocked(publishReportShare)
        .mockResolvedValueOnce(share())
        .mockRejectedValueOnce(new Error("S3 kapalı."));
      const { result } = renderAssistant("cal-1");
      await flush();

      await act(() => result.current.sendReport());
      expect(publishReportShare).toHaveBeenCalledWith(
        "cal-1",
        expect.objectContaining({ summary: "Özet" }),
      );
      expect(result.current.shareStatus).toBe(BotStatus.Ok);

      await act(() => result.current.sendReport());
      expect(result.current.shareError).toBe("S3 kapalı.");
    });

    it("still sends the report after transcript edits, which never feed it", async () => {
      vi.mocked(publishReportShare).mockResolvedValue(share());
      const { result } = renderAssistant("cal-1");
      await flush();
      act(() => result.current.updateTranscriptLine("a", { text: "Düzelt" }));

      await act(() => result.current.sendReport());

      expect(publishReportShare).toHaveBeenCalledWith(
        "cal-1",
        expect.objectContaining({ summary: "Özet" }),
      );
    });
  });

  describe("stopping the bot", () => {
    it("does nothing without a meeting that has a bot", async () => {
      const { result } = renderAssistant();

      await act(() => result.current.stopBot());

      expect(stopMeetingBot).not.toHaveBeenCalled();
    });

    it("shows why the bot could not be stopped", async () => {
      calendar.meetings = [
        calendarMeeting({ scheduledAt: "2026-09-15T09:30:00Z" }),
      ];
      vi.mocked(stopMeetingBot).mockRejectedValue("offline");
      const { result } = renderAssistant();
      await flush();

      await act(() => result.current.stopBot());

      expect(result.current.botStatus).toBe(BotStatus.Err);
      expect(result.current.botError).toBe("Toplantı asistanı durdurulamadı.");
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    it("completes the meeting even when the final transcript cannot be read", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      calendar.meetings = [
        calendarMeeting({ scheduledAt: "2026-09-15T09:30:00Z" }),
      ];
      const { result } = renderAssistant();
      await flush();
      vi.mocked(stopMeetingBot).mockResolvedValue();
      vi.mocked(fetchTranscript).mockRejectedValue(new Error("404"));

      await act(() => result.current.stopBot());

      expect(consoleError).toHaveBeenCalled();
      expect(result.current.selected?.status).toBe(MeetingStatus.Completed);
      expect(updateMeeting).toHaveBeenCalledWith("cal-1", {
        status: CalendarStatus.Completed,
        transcriptBotDispatched: true,
      });
      expect(calendar.refetch).toHaveBeenCalled();
      expect(generateMeetingReport).not.toHaveBeenCalled();
      expect(result.current.botStatus).toBe(BotStatus.Ok);
    });
  });

  it("follows a newly linked meeting", async () => {
    calendar.meetings = [
      calendarMeeting({ id: "cal-1" }),
      calendarMeeting({ id: "cal-2", agenda: "İkinci" }),
    ];
    const { result, rerender } = renderHook(
      ({ id }) => useMeetingAssistant(id),
      { initialProps: { id: "cal-1" }, wrapper: Turkish },
    );
    await flush();
    expect(result.current.selected?.id).toBe("cal-1");

    rerender({ id: "cal-2" });

    expect(result.current.selected?.id).toBe("cal-2");
    expect(result.current.targetMeetingId).toBe("cal-2");
  });
});
