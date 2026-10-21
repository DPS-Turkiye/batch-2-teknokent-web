import { useMeetings } from "@/hooks/use-meetings";
import {
  addMeetingBot,
  fetchTranscript,
  generateMeetingReport,
  stopMeetingBot,
} from "@/lib/assistant";
import {
  matchCalendarMeetingId,
  platformLabel,
  toAssistantMeeting,
  isAssistantCalendarMeeting,
  withAssistantOverlay,
} from "@/lib/assistant-meetings";
import {
  addBotBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { MeetingStatus as CalendarMeetingStatus } from "@/interfaces/meeting";
import { updateMeeting } from "@/lib/client/meetings";
import {
  getAssistantShare,
  publishTranscriptShare,
  publishReportShare,
} from "@/lib/client/meeting-notes";
import {
  MEETING_STATUS_META,
  TRANSCRIPT_BOT_MAX_TIMER_MS,
  TRANSCRIPT_POLL_MS,
} from "@/lib/const";
import { whenVisible } from "@/lib/poll";
import {
  isTranscriptBotDue,
  nextTranscriptBotAction,
} from "@/lib/transcript-bot";
import {
  BotStatus,
  MeetingStatus,
  type Meeting,
  type MeetingReport,
  type TranscriptLine,
} from "@/types/assistant";
import { useLocale, useTranslations } from "next-intl";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export { MEETING_STATUS_META as STATUS_META };

type MeetingOverlay = Partial<
  Pick<
    Meeting,
    "status" | "nativeMeetingId" | "platformKey" | "platform" | "title"
  >
>;

function mapSegments(
  segments: {
    id?: string;
    speaker?: string | null;
    text?: string | null;
    at?: string | null;
  }[],
): TranscriptLine[] {
  return segments.map((s, index) => ({
    id: s.id?.trim() || `${s.at ?? ""}-${s.text ?? ""}` || `line-${index}`,
    speaker: s.speaker?.trim() || "Speaker",
    text: s.text ?? "",
    at: s.at ?? "",
  }));
}

function normalizeReport(report: MeetingReport): MeetingReport {
  return {
    ...report,
    title: report.title || "Toplantı raporu",
    meetingDate: report.meetingDate ?? null,
    topic: report.topic ?? null,
    summary: report.summary ?? "",
    topicsDiscussed: report.topicsDiscussed ?? [],
    decisions: report.decisions ?? [],
    actionItems: (report.actionItems ?? []).map((item) => ({
      owner: item.owner ?? null,
      task: item.task || "",
      due: item.due ?? null,
    })),
    risksOrBlockers: report.risksOrBlockers ?? [],
    nextSteps: report.nextSteps ?? [],
    model: report.model ?? "",
  };
}

function transcriptBotSentKey(meetingId: string) {
  return `transcript-bot-sent:${meetingId}`;
}

function wasTranscriptBotSent(meetingId: string) {
  try {
    return sessionStorage.getItem(transcriptBotSentKey(meetingId)) === "1";
  } catch {
    return false;
  }
}

function markTranscriptBotSent(meetingId: string, sent: boolean) {
  try {
    if (sent) sessionStorage.setItem(transcriptBotSentKey(meetingId), "1");
    else sessionStorage.removeItem(transcriptBotSentKey(meetingId));
  } catch {}
}

function hasText(lines: TranscriptLine[]) {
  return lines.some((line) => line.text.trim());
}

function publishableTranscript(lines: TranscriptLine[]) {
  return lines
    .filter((line) => line.text.trim())
    .map((line) => ({
      id: line.id,
      speaker: line.speaker,
      text: line.text,
      at: line.at,
    }));
}

export function useMeetingAssistant(requestedMeetingId?: string) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const meetingTexts = useMemo(
    () => ({ meetingFallback: t("meetingFallback"), locale }),
    [t, locale],
  );
  const platformMeetingsQuery = useMeetings();
  const calendarItems = useMemo(
    () => platformMeetingsQuery.data ?? [],
    [platformMeetingsQuery.data],
  );
  const sendingBotRef = useRef(false);
  const autoReportAttemptedRef = useRef<Record<string, boolean>>({});
  const reportInFlightRef = useRef<Record<string, Promise<void>>>({});
  const [adHocMeetings, setAdHocMeetings] = useState<Meeting[]>([]);
  const [overlays, setOverlays] = useState<Record<string, MeetingOverlay>>({});
  const [selectedId, setSelectedId] = useState(requestedMeetingId ?? "");
  const [openedFor, setOpenedFor] = useState(requestedMeetingId);
  if (openedFor !== requestedMeetingId) {
    setOpenedFor(requestedMeetingId);
    setSelectedId(requestedMeetingId ?? "");
  }
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [transcriptByMeeting, setTranscriptByMeeting] = useState<
    Record<string, TranscriptLine[]>
  >({});
  const [transcriptDirtyByMeeting, setTranscriptDirtyByMeeting] = useState<
    Record<string, boolean>
  >({});
  const [reportByMeeting, setReportByMeeting] = useState<
    Record<string, MeetingReport>
  >({});
  const [shareLoadedFor, setShareLoadedFor] = useState<Record<string, boolean>>(
    {},
  );
  const [reportStatus, setReportStatus] = useState<BotStatus | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [targetMeetingId, setTargetMeetingId] = useState("");
  const [shareStatus, setShareStatus] = useState<BotStatus | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const calendarMeetings = useMemo(() => {
    return calendarItems
      .filter(
        (item) =>
          isAssistantCalendarMeeting(item) || item.id === requestedMeetingId,
      )
      .map((item) =>
        withAssistantOverlay(
          toAssistantMeeting(item, meetingTexts),
          overlays[item.id],
        ),
      );
  }, [calendarItems, overlays, requestedMeetingId, meetingTexts]);

  const meetings = useMemo(() => {
    const calendarIds = new Set(calendarMeetings.map((item) => item.id));
    return [
      ...adHocMeetings.filter((item) => !calendarIds.has(item.id)),
      ...calendarMeetings,
    ];
  }, [adHocMeetings, calendarMeetings]);

  const selected = useMemo(
    () => meetings.find((item) => item.id === selectedId) ?? meetings[0],
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

  const canPersist = useCallback(
    (meetingId: string) => calendarItems.some((item) => item.id === meetingId),
    [calendarItems],
  );
  const notebookMeetingId =
    selected && canPersist(selected.id) ? selected.id : targetMeetingId;

  const selectedMeetLink = selected
    ? (calendarItems
        .find((item) => item.id === selected.id)
        ?.meetLink?.trim() ?? "")
    : "";

  useEffect(() => {
    if (!selected || !canPersist(selected.id) || shareLoadedFor[selected.id]) {
      return;
    }
    if (transcriptDirtyByMeeting[selected.id]) {
      return;
    }

    const meetingId = selected.id;
    let cancelled = false;
    void getAssistantShare(meetingId)
      .then((share) => {
        if (cancelled) return;
        if (share.transcript?.length) {
          setTranscriptByMeeting((prev) => ({
            ...prev,
            [meetingId]: share.transcript ?? [],
          }));
        }
        if (share.report) {
          setReportByMeeting((prev) => ({
            ...prev,
            [meetingId]: normalizeReport(share.report as MeetingReport),
          }));
        }
      })
      .catch((error) => {
        console.error("Failed to load saved transcript", error);
      })
      .finally(() => {
        if (!cancelled) {
          setShareLoadedFor((prev) => ({ ...prev, [meetingId]: true }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selected, canPersist, shareLoadedFor, transcriptDirtyByMeeting]);

  const transcriptByMeetingRef = useRef(transcriptByMeeting);
  useEffect(() => {
    transcriptByMeetingRef.current = transcriptByMeeting;
  }, [transcriptByMeeting]);

  useEffect(() => {
    const parsed = transcriptQuerySchema.safeParse({
      platform: selected?.platformKey,
      nativeMeetingId: selected?.nativeMeetingId,
    });
    if (!parsed.success || !selected) return;
    if (
      canPersist(selected.id) &&
      !shareLoadedFor[selected.id] &&
      !transcriptDirtyByMeeting[selected.id]
    ) {
      return;
    }
    if (transcriptDirtyByMeeting[selected.id]) return;
    if (
      selected.status === MeetingStatus.Completed &&
      hasText(transcriptByMeetingRef.current[selected.id] ?? [])
    ) {
      return;
    }

    const meetingId = selected.id;
    const { platform, nativeMeetingId } = parsed.data;
    let cancelled = false;

    const load = async () => {
      try {
        const segments = await fetchTranscript(platform, nativeMeetingId);
        if (cancelled) return;
        const lines = mapSegments(segments);
        setTranscriptByMeeting((prev) => ({
          ...prev,
          [meetingId]: lines,
        }));
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

    const timer = window.setInterval(whenVisible(load), TRANSCRIPT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selected, canPersist, shareLoadedFor, transcriptDirtyByMeeting]);

  const sendBotForUrl = useCallback(
    async (
      url: string,
      options?: { keepUrl?: boolean; calendarMeetingId?: string },
    ) => {
      const parsed = addBotBodySchema.safeParse({ meetingUrl: url });
      if (!parsed.success || sendingBotRef.current) return false;

      sendingBotRef.current = true;
      setBotStatus(BotStatus.Sending);
      setBotError(null);

      const persistId =
        options?.calendarMeetingId ??
        matchCalendarMeetingId(calendarItems, parsed.data.meetingUrl);

      try {
        const result = await addMeetingBot(parsed.data.meetingUrl);
        const calendarItem = persistId
          ? calendarItems.find((item) => item.id === persistId)
          : undefined;
        const next: Meeting = {
          id: persistId ?? result.id ?? `m${Date.now()}`,
          title: calendarItem?.agenda?.trim() || result.title || t("newBot"),
          platform: platformLabel(result.platform),
          platformKey: result.platform,
          nativeMeetingId: result.nativeMeetingId,
          status:
            result.status === "joining"
              ? MeetingStatus.Joining
              : MeetingStatus.Scheduled,
          when: calendarItem
            ? toAssistantMeeting(calendarItem, meetingTexts).when
            : t("now"),
          participants: calendarItem
            ? toAssistantMeeting(calendarItem, meetingTexts).participants
            : [],
        };

        if (persistId) {
          setOverlays((prev) => ({
            ...prev,
            [persistId]: {
              nativeMeetingId: next.nativeMeetingId,
              platformKey: next.platformKey,
              platform: next.platform,
              status: next.status,
              title: next.title,
            },
          }));
        } else {
          setAdHocMeetings((prev) => [
            next,
            ...prev.filter((item) => item.id !== next.id),
          ]);
        }
        setSelectedId(next.id);
        setMeetingUrl(options?.keepUrl ? parsed.data.meetingUrl : "");
        setBotStatus(BotStatus.Ok);
        setTranscriptByMeeting((prev) => ({ ...prev, [next.id]: [] }));
        window.setTimeout(() => setBotStatus(null), 4000);

        if (persistId) {
          markTranscriptBotSent(persistId, true);
          try {
            await updateMeeting(persistId, {
              transcriptBotDispatched: true,
            });
          } catch (error) {
            console.error("Failed to mark transcript bot dispatched", error);
          }
        }
        return true;
      } catch (error) {
        if (persistId) {
          markTranscriptBotSent(persistId, false);
        }
        setBotStatus(BotStatus.Err);
        setBotError(error instanceof Error ? error.message : t("sendFailed"));
        window.setTimeout(() => setBotStatus(null), 5000);
        return false;
      } finally {
        sendingBotRef.current = false;
      }
    },
    [calendarItems, meetingTexts, t],
  );

  useEffect(() => {
    const calendarMeetingsDue = platformMeetingsQuery.data ?? [];
    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      const due = calendarMeetingsDue.find((item) => isTranscriptBotDue(item));
      const dueLink = due?.meetLink?.trim();
      if (dueLink) {
        setMeetingUrl((current) => (current === dueLink ? current : dueLink));
      }

      const action = nextTranscriptBotAction(calendarMeetingsDue);
      if (!action) return;

      if (action.delayMs > 0) {
        timer = window.setTimeout(
          schedule,
          Math.min(action.delayMs, TRANSCRIPT_BOT_MAX_TIMER_MS),
        );
        return;
      }

      setMeetingUrl((current) =>
        current === action.meetLink ? current : action.meetLink,
      );

      if (wasTranscriptBotSent(action.meetingId)) return;

      markTranscriptBotSent(action.meetingId, true);
      void sendBotForUrl(action.meetLink, {
        keepUrl: true,
        calendarMeetingId: action.meetingId,
      }).then((ok) => {
        if (!ok) markTranscriptBotSent(action.meetingId, false);
      });
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [platformMeetingsQuery.data, sendBotForUrl]);

  const visibleTranscript = selectedTranscript;
  const notes: string[] = [];
  const status = selected
    ? MEETING_STATUS_META[selected.status]
    : MEETING_STATUS_META[MeetingStatus.Scheduled];
  const addBot = async (event?: FormEvent) => {
    event?.preventDefault();
    await sendBotForUrl(selectedMeetLink || meetingUrl);
  };

  const requestMeetingReport = useCallback(
    async (lines?: TranscriptLine[], meeting?: Meeting) => {
      const target = meeting ?? selected;
      if (!target?.platformKey || !target?.nativeMeetingId) return;
      const segments = (
        lines ??
        transcriptByMeetingRef.current[target.id] ??
        []
      ).filter((line) => line.text.trim());
      if (segments.length === 0) {
        setReportStatus(BotStatus.Err);
        setReportError(t("reportNeedsTranscript"));
        window.setTimeout(() => setReportStatus(null), 6000);
        return;
      }

      const existing = reportInFlightRef.current[target.id];
      if (existing) return existing;

      autoReportAttemptedRef.current[target.id] = true;
      setReportStatus(BotStatus.Sending);
      setReportError(null);
      const run = (async () => {
        try {
          const report = normalizeReport(
            await generateMeetingReport(
              target.platformKey,
              target.nativeMeetingId,
              segments,
            ),
          );
          setReportByMeeting((prev) => ({
            ...prev,
            [target.id]: report,
          }));
          setTranscriptDirtyByMeeting((prev) => ({
            ...prev,
            [target.id]: false,
          }));
          setReportStatus(BotStatus.Ok);
          window.setTimeout(() => setReportStatus(null), 4000);
        } catch (error) {
          autoReportAttemptedRef.current[target.id] = false;
          setReportStatus(BotStatus.Err);
          setReportError(
            error instanceof Error ? error.message : t("reportFailed"),
          );
          window.setTimeout(() => setReportStatus(null), 6000);
        } finally {
          delete reportInFlightRef.current[target.id];
        }
      })();
      reportInFlightRef.current[target.id] = run;
      return run;
    },
    [selected, t],
  );

  const selectedTranscriptFingerprint = selectedTranscript
    .filter((line) => line.text.trim())
    .map((line) => `${line.speaker}:${line.text}`)
    .join("\n");

  useEffect(() => {
    if (!selected) return;
    if (!selected.platformKey || !selected.nativeMeetingId) return;
    if (canPersist(selected.id) && !shareLoadedFor[selected.id]) return;
    if (reportByMeeting[selected.id]) return;
    if (autoReportAttemptedRef.current[selected.id]) return;
    const lines = transcriptByMeetingRef.current[selected.id] ?? [];
    if (!hasText(lines)) return;
    const timer = window.setTimeout(() => {
      void requestMeetingReport(lines, selected);
    }, 4_000);
    return () => window.clearTimeout(timer);
  }, [
    selected,
    canPersist,
    shareLoadedFor,
    reportByMeeting,
    selectedTranscriptFingerprint,
    requestMeetingReport,
  ]);

  const markCompleted = (meetingId: string) => {
    setOverlays((prev) => ({
      ...prev,
      [meetingId]: { ...prev[meetingId], status: MeetingStatus.Completed },
    }));
    setAdHocMeetings((prev) =>
      prev.map((item) =>
        item.id === meetingId
          ? { ...item, status: MeetingStatus.Completed }
          : item,
      ),
    );
  };

  const stopBot = async () => {
    const meeting = selected;
    if (!meeting?.platformKey || !meeting?.nativeMeetingId) return;
    if (botStatus === BotStatus.Sending) return;

    setBotStatus(BotStatus.Sending);
    setBotError(null);

    try {
      await stopMeetingBot(meeting.platformKey, meeting.nativeMeetingId);
      let lines = transcriptByMeeting[meeting.id] ?? [];
      try {
        const segments = await fetchTranscript(
          meeting.platformKey,
          meeting.nativeMeetingId,
        );
        lines = mapSegments(segments);
        setTranscriptByMeeting((prev) => ({
          ...prev,
          [meeting.id]: lines,
        }));
      } catch (error) {
        console.error("Failed to fetch transcript after stop", error);
      }
      markCompleted(meeting.id);
      let storedAsCompleted = true;
      if (canPersist(meeting.id)) {
        try {
          await updateMeeting(meeting.id, {
            status: CalendarMeetingStatus.Completed,
            transcriptBotDispatched: true,
          });
        } catch (error) {
          console.error("Failed to mark meeting completed after stop", error);
          storedAsCompleted = false;
        }
      }
      void platformMeetingsQuery.refetch();
      if (storedAsCompleted) {
        setBotStatus(BotStatus.Ok);
        window.setTimeout(() => setBotStatus(null), 4000);
      } else {
        setBotStatus(BotStatus.Err);
        setBotError(t("stopNotMarked"));
        window.setTimeout(() => setBotStatus(null), 8000);
      }

      if (hasText(lines)) {
        await requestMeetingReport(lines, meeting);
      }
    } catch (error) {
      setBotStatus(BotStatus.Err);
      setBotError(error instanceof Error ? error.message : t("stopFailed"));
      window.setTimeout(() => setBotStatus(null), 5000);
    }
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
    const lines = publishableTranscript(selectedTranscript);
    if (!notebookMeetingId || lines.length === 0) return;
    setShareStatus(BotStatus.Sending);
    setShareError(null);
    try {
      await publishTranscriptShare(notebookMeetingId, lines);
      setShareStatus(BotStatus.Ok);
      window.setTimeout(() => setShareStatus(null), 4000);
    } catch (error) {
      setShareStatus(BotStatus.Err);
      setShareError(
        error instanceof Error ? error.message : t("transcriptShareFailed"),
      );
      window.setTimeout(() => setShareStatus(null), 6000);
    }
  };

  const sendReport = async () => {
    if (!notebookMeetingId || !meetingReport || transcriptDirty) return;
    setShareStatus(BotStatus.Sending);
    setShareError(null);
    try {
      await publishReportShare(notebookMeetingId, meetingReport);
      setShareStatus(BotStatus.Ok);
      window.setTimeout(() => setShareStatus(null), 4000);
    } catch (error) {
      setShareStatus(BotStatus.Err);
      setShareError(
        error instanceof Error ? error.message : t("reportShareFailed"),
      );
      window.setTimeout(() => setShareStatus(null), 6000);
    }
  };

  return {
    meetings,
    selected,
    setSelectedId,
    meetingUrl: selectedMeetLink || meetingUrl,
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
    addBot,
    stopBot,
    meetingReport,
    reportStatus,
    reportError,
    regenerateReport: () => {
      void requestMeetingReport();
    },
    platformMeetings: platformMeetingsQuery.data ?? [],
    isLoadingMeetings: platformMeetingsQuery.isLoading,
    targetMeetingId: notebookMeetingId,
    setTargetMeetingId,
    shareStatus,
    shareError,
    sendTranscript,
    sendReport,
  };
}
