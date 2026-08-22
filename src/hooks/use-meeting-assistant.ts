import {
  addMeetingBot,
  fetchTranscript,
  generateMeetingReport,
  stopMeetingBot,
} from "@/lib/assistant";
import {
  addBotBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import {
  ASSISTANT_INITIAL_MEETINGS,
  ASSISTANT_SAMPLE_NOTES,
  ASSISTANT_SAMPLE_PAD,
  MEETING_STATUS_META,
} from "@/lib/const";
import {
  BotStatus,
  MeetingPlatform,
  MeetingStatus,
  type Meeting,
  type MeetingReport,
  type TranscriptLine,
} from "@/types/assistant";
import { FormEvent, useEffect, useMemo, useState } from "react";

export { MEETING_STATUS_META as STATUS_META };

function platformLabel(platform: string): MeetingPlatform {
  if (platform === "google_meet") return MeetingPlatform.GoogleMeet;
  if (platform === "zoom") return MeetingPlatform.Zoom;
  if (platform === "teams") return MeetingPlatform.Teams;
  return MeetingPlatform.Jitsi;
}

export function useMeetingAssistant() {
  const [meetings, setMeetings] = useState(ASSISTANT_INITIAL_MEETINGS);
  const [selectedId, setSelectedId] = useState(
    ASSISTANT_INITIAL_MEETINGS[0].id,
  );
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [padByMeeting, setPadByMeeting] =
    useState<Record<string, string>>(ASSISTANT_SAMPLE_PAD);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [reportByMeeting, setReportByMeeting] = useState<
    Record<string, MeetingReport>
  >({});
  const [reportStatus, setReportStatus] = useState<BotStatus | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? meetings[0],
    [meetings, selectedId],
  );

  useEffect(() => {
    const parsed = transcriptQuerySchema.safeParse({
      platform: selected?.platformKey,
      nativeMeetingId: selected?.nativeMeetingId,
    });
    if (!parsed.success) {
      return;
    }

    const { platform, nativeMeetingId } = parsed.data;
    let cancelled = false;

    const load = async () => {
      try {
        const segments = await fetchTranscript(platform, nativeMeetingId);
        if (!cancelled) {
          setTranscript(
            segments.map((s) => ({
              id: s.id || `${s.at}-${s.text}`,
              speaker: s.speaker,
              text: s.text,
              at: s.at,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch transcript", {
          platform,
          nativeMeetingId,
          error,
        });
      }
    };

    void load();

    const shouldPoll =
      selected?.status === MeetingStatus.Active ||
      selected?.status === MeetingStatus.Joining;

    if (!shouldPoll) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(load, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selected?.platformKey, selected?.nativeMeetingId, selected?.status]);

  const visibleTranscript = transcriptQuerySchema.safeParse({
    platform: selected?.platformKey,
    nativeMeetingId: selected?.nativeMeetingId,
  }).success
    ? transcript
    : [];

  const notes = ASSISTANT_SAMPLE_NOTES[selected.id] ?? [];
  const status = MEETING_STATUS_META[selected.status];
  const padText = padByMeeting[selected.id] ?? "";
  const padSaved = padText.trim().length > 0;
  const meetingReport = reportByMeeting[selected.id] ?? null;

  const addBot = async (event?: FormEvent) => {
    event?.preventDefault();
    const parsed = addBotBodySchema.safeParse({ meetingUrl });
    if (!parsed.success || botStatus === BotStatus.Sending) return;

    setBotStatus(BotStatus.Sending);
    setBotError(null);

    try {
      const result = await addMeetingBot(parsed.data.meetingUrl);

      const next: Meeting = {
        id: result.id || `m${Date.now()}`,
        title: result.title || "Yeni toplantı botu",
        platform: platformLabel(result.platform),
        platformKey: result.platform,
        nativeMeetingId: result.nativeMeetingId,
        status:
          result.status === "joining"
            ? MeetingStatus.Joining
            : MeetingStatus.Scheduled,
        when: "Şimdi",
        participants: ["Ayşe Kaya"],
      };

      setMeetings((prev) => [next, ...prev]);
      setSelectedId(next.id);
      setMeetingUrl("");
      setBotStatus(BotStatus.Ok);
      setTranscript([]);
      window.setTimeout(() => setBotStatus(null), 4000);
    } catch (error) {
      setBotStatus(BotStatus.Err);
      setBotError(
        error instanceof Error ? error.message : "Failed to send bot",
      );
      window.setTimeout(() => setBotStatus(null), 5000);
    }
  };

  const requestMeetingReport = async (
    platform: string,
    nativeMeetingId: string,
    meetingId: string,
  ) => {
    setReportStatus(BotStatus.Sending);
    setReportError(null);
    try {
      const report = await generateMeetingReport(platform, nativeMeetingId);
      setReportByMeeting((prev) => ({
        ...prev,
        [meetingId]: {
          ...report,
          topicsDiscussed: report.topicsDiscussed ?? [],
          decisions: report.decisions ?? [],
          actionItems: report.actionItems ?? [],
          risksOrBlockers: report.risksOrBlockers ?? [],
          nextSteps: report.nextSteps ?? [],
        },
      }));
      setReportStatus(BotStatus.Ok);
      window.setTimeout(() => setReportStatus(null), 4000);
    } catch (error) {
      setReportStatus(BotStatus.Err);
      setReportError(
        error instanceof Error
          ? error.message
          : "Failed to generate meeting report",
      );
      window.setTimeout(() => setReportStatus(null), 6000);
    }
  };

  const stopBot = async () => {
    if (!selected?.platformKey || !selected?.nativeMeetingId) return;
    if (botStatus === BotStatus.Sending) return;

    setBotStatus(BotStatus.Sending);
    setBotError(null);

    try {
      await stopMeetingBot(selected.platformKey, selected.nativeMeetingId);
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, status: MeetingStatus.Completed } : m,
        ),
      );
      setBotStatus(BotStatus.Ok);
      window.setTimeout(() => setBotStatus(null), 4000);
      void requestMeetingReport(
        selected.platformKey,
        selected.nativeMeetingId,
        selected.id,
      );
    } catch (error) {
      setBotStatus(BotStatus.Err);
      setBotError(
        error instanceof Error ? error.message : "Failed to stop bot",
      );
      window.setTimeout(() => setBotStatus(null), 5000);
    }
  };

  const updatePadText = (value: string) => {
    setPadByMeeting((prev) => ({
      ...prev,
      [selected.id]: value,
    }));
  };

  return {
    meetings,
    selected,
    setSelectedId,
    meetingUrl,
    setMeetingUrl,
    botStatus,
    botError,
    visibleTranscript,
    notes,
    status,
    padText,
    padSaved,
    updatePadText,
    addBot,
    stopBot,
    meetingReport,
    reportStatus,
    reportError,
    regenerateReport: () => {
      if (!selected?.platformKey || !selected?.nativeMeetingId) return;
      void requestMeetingReport(
        selected.platformKey,
        selected.nativeMeetingId,
        selected.id,
      );
    },
  };
}
