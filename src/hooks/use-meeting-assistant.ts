import { useMeetings } from "@/hooks/use-meetings";
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
import { postAssistantShare } from "@/lib/client/meeting-notes";
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

function mapSegments(
  segments: { id?: string; speaker: string; text: string; at: string }[],
): TranscriptLine[] {
  return segments.map((s) => ({
    id: s.id || `${s.at}-${s.text}`,
    speaker: s.speaker,
    text: s.text,
    at: s.at,
  }));
}

function normalizeReport(report: MeetingReport): MeetingReport {
  return {
    ...report,
    topicsDiscussed: report.topicsDiscussed ?? [],
    decisions: report.decisions ?? [],
    actionItems: report.actionItems ?? [],
    risksOrBlockers: report.risksOrBlockers ?? [],
    nextSteps: report.nextSteps ?? [],
  };
}

export function useMeetingAssistant() {
  const platformMeetingsQuery = useMeetings();
  const [meetings, setMeetings] = useState(ASSISTANT_INITIAL_MEETINGS);
  const [selectedId, setSelectedId] = useState(
    ASSISTANT_INITIAL_MEETINGS[0].id,
  );
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [padByMeeting, setPadByMeeting] =
    useState<Record<string, string>>(ASSISTANT_SAMPLE_PAD);
  const [transcriptByMeeting, setTranscriptByMeeting] = useState<
    Record<string, TranscriptLine[]>
  >({});
  const [transcriptDirtyByMeeting, setTranscriptDirtyByMeeting] = useState<
    Record<string, boolean>
  >({});
  const [reportByMeeting, setReportByMeeting] = useState<
    Record<string, MeetingReport>
  >({});
  const [reportStatus, setReportStatus] = useState<BotStatus | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [targetMeetingId, setTargetMeetingId] = useState("");
  const [shareStatus, setShareStatus] = useState<BotStatus | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? meetings[0],
    [meetings, selectedId],
  );

  const selectedTranscript = selected
    ? (transcriptByMeeting[selected.id] ?? [])
    : [];
  const transcriptDirty = selected
    ? Boolean(transcriptDirtyByMeeting[selected.id])
    : false;
  const canEditTranscript = selected?.status === MeetingStatus.Completed;
  const meetingReport = selected
    ? (reportByMeeting[selected.id] ?? null)
    : null;

  useEffect(() => {
    const parsed = transcriptQuerySchema.safeParse({
      platform: selected?.platformKey,
      nativeMeetingId: selected?.nativeMeetingId,
    });
    if (!parsed.success || !selected) {
      return;
    }
    if (
      transcriptDirtyByMeeting[selected.id] ||
      selected.status === MeetingStatus.Completed
    ) {
      return;
    }

    const { platform, nativeMeetingId } = parsed.data;
    let cancelled = false;

    const load = async () => {
      try {
        const segments = await fetchTranscript(platform, nativeMeetingId);
        if (!cancelled) {
          setTranscriptByMeeting((prev) => ({
            ...prev,
            [selected.id]: mapSegments(segments),
          }));
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
      selected.status === MeetingStatus.Active ||
      selected.status === MeetingStatus.Joining;

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
  }, [
    selected,
    selected?.id,
    selected?.platformKey,
    selected?.nativeMeetingId,
    selected?.status,
    transcriptDirtyByMeeting,
  ]);

  const visibleTranscript = selectedTranscript;

  const notes = ASSISTANT_SAMPLE_NOTES[selected.id] ?? [];
  const status = MEETING_STATUS_META[selected.status];
  const padText = padByMeeting[selected.id] ?? "";
  const padSaved = padText.trim().length > 0;

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
      setTranscriptByMeeting((prev) => ({ ...prev, [next.id]: [] }));
      window.setTimeout(() => setBotStatus(null), 4000);
    } catch (error) {
      setBotStatus(BotStatus.Err);
      setBotError(
        error instanceof Error ? error.message : "Failed to send bot",
      );
      window.setTimeout(() => setBotStatus(null), 5000);
    }
  };

  const requestMeetingReport = async () => {
    if (!selected?.platformKey || !selected?.nativeMeetingId) return;
    const segments = selectedTranscript.filter((line) => line.text.trim());
    if (segments.length === 0) {
      setReportStatus(BotStatus.Err);
      setReportError("Rapor için önce transkript gerekli.");
      window.setTimeout(() => setReportStatus(null), 6000);
      return;
    }

    setReportStatus(BotStatus.Sending);
    setReportError(null);
    try {
      const report = await generateMeetingReport(
        selected.platformKey,
        selected.nativeMeetingId,
        segments,
      );
      setReportByMeeting((prev) => ({
        ...prev,
        [selected.id]: normalizeReport(report),
      }));
      setTranscriptDirtyByMeeting((prev) => ({
        ...prev,
        [selected.id]: false,
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
      try {
        const segments = await fetchTranscript(
          selected.platformKey,
          selected.nativeMeetingId,
        );
        setTranscriptByMeeting((prev) => ({
          ...prev,
          [selected.id]: mapSegments(segments),
        }));
      } catch (error) {
        console.error("Failed to fetch transcript after stop", error);
      }
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, status: MeetingStatus.Completed } : m,
        ),
      );
      setBotStatus(BotStatus.Ok);
      window.setTimeout(() => setBotStatus(null), 4000);
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

  const updateTranscriptLine = (
    lineId: string,
    patch: Partial<Pick<TranscriptLine, "speaker" | "text">>,
  ) => {
    if (!selected || !canEditTranscript) return;
    setTranscriptDirtyByMeeting((prev) => ({ ...prev, [selected.id]: true }));
    setTranscriptByMeeting((prev) => ({
      ...prev,
      [selected.id]: (prev[selected.id] ?? []).map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    }));
  };

  const removeTranscriptLine = (lineId: string) => {
    if (!selected || !canEditTranscript) return;
    setTranscriptDirtyByMeeting((prev) => ({ ...prev, [selected.id]: true }));
    setTranscriptByMeeting((prev) => ({
      ...prev,
      [selected.id]: (prev[selected.id] ?? []).filter(
        (line) => line.id !== lineId,
      ),
    }));
  };

  const sendTranscript = async () => {
    if (!targetMeetingId || selectedTranscript.length === 0) return;
    setShareStatus(BotStatus.Sending);
    setShareError(null);
    try {
      await postAssistantShare(targetMeetingId, {
        kind: "TRANSCRIPT",
        transcript: selectedTranscript,
      });
      setShareStatus(BotStatus.Ok);
      window.setTimeout(() => setShareStatus(null), 4000);
    } catch (error) {
      setShareStatus(BotStatus.Err);
      setShareError(
        error instanceof Error ? error.message : "Transkript gönderilemedi.",
      );
      window.setTimeout(() => setShareStatus(null), 6000);
    }
  };

  const sendReport = async () => {
    if (!targetMeetingId || !meetingReport || transcriptDirty) return;
    setShareStatus(BotStatus.Sending);
    setShareError(null);
    try {
      await postAssistantShare(targetMeetingId, {
        kind: "REPORT",
        report: meetingReport,
      });
      setShareStatus(BotStatus.Ok);
      window.setTimeout(() => setShareStatus(null), 4000);
    } catch (error) {
      setShareStatus(BotStatus.Err);
      setShareError(
        error instanceof Error ? error.message : "Rapor gönderilemedi.",
      );
      window.setTimeout(() => setShareStatus(null), 6000);
    }
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
    canEditTranscript,
    transcriptDirty,
    updateTranscriptLine,
    removeTranscriptLine,
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
      void requestMeetingReport();
    },
    platformMeetings: platformMeetingsQuery.data ?? [],
    targetMeetingId,
    setTargetMeetingId,
    shareStatus,
    shareError,
    sendTranscript,
    sendReport,
  };
}
