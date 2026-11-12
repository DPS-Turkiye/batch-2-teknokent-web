"use client";

import { Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { BotStatusRenderer } from "@/components/assistant/bot-status-renderer";
import { MeetingBotNoticeLine } from "@/components/assistant/meeting-bot-notice";
import { MeetingReportView } from "@/components/assistant/meeting-report-view";
import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import {
  STATUS_META,
  useMeetingAssistant,
} from "@/hooks/use-meeting-assistant";
import { useMeetingBotState } from "@/hooks/use-meeting-bot-state";
import { formatSlotDateTime } from "@/lib/format";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";
import { BotStatus, MeetingStatus } from "@/types/assistant";

export default function AssistantPage() {
  return (
    <Suspense fallback={<AppShell active={AppArea.Assistant}>{null}</AppShell>}>
      <MeetingAssistantWorkspace />
    </Suspense>
  );
}

function MeetingAssistantWorkspace() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const session = useAppSession();
  const requestedMeetingId = useSearchParams().get("meetingId") ?? undefined;
  const {
    meetings,
    selected,
    setSelectedId,
    meetingUrl,
    setMeetingUrl,
    linkNotInCalendar,
    botStatus,
    botError,
    visibleTranscript,
    canEditTranscript,
    updateTranscriptLine,
    removeTranscriptLine,
    notes,
    status,
    addBot,
    stopBot,
    meetingReport,
    canReport,
    reportStatus,
    reportError,
    regenerateReport,
    platformMeetings,
    isLoadingMeetings,
    targetMeetingId,
    setTargetMeetingId,
    shareStatus,
    shareError,
    sendTranscript,
    sendReport,
  } = useMeetingAssistant(requestedMeetingId, session?.role);
  const { botNotice, botNoticeTone } = useMeetingBotState(selected);

  return (
    <AppShell active={AppArea.Assistant}>
      <div className="ma-wb flex h-[calc(100vh-3.5rem)] min-h-[520px] flex-col lg:h-screen">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[280px] shrink-0 flex-col border-r border-[var(--ma-line)] bg-[var(--ma-sidebar)] max-md:w-[240px]">
            <div className="flex items-center gap-2.5 px-3.5 pb-2 pt-3">
              <span className="flex size-6 items-center justify-center rounded-md bg-[var(--ma-accentbg)] text-[11px] font-bold text-[var(--ma-accent)]">
                A
              </span>
              <span className="text-[13px] font-medium text-[var(--ma-t1)]">
                {t("brand")}{" "}
                <span className="font-normal text-[var(--ma-t3)]">
                  {t("brandSuffix")}
                </span>
              </span>
            </div>

            <div className="border-b border-[var(--ma-line)] px-2 pb-2">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded-md bg-[var(--ma-panel2)] px-2.5 py-1.5 text-[12.5px] text-[var(--ma-t1)]"
              >
                <Calendar
                  className="size-[13px]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {t("meetingsTab")}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="mb-1.5 flex items-center px-1">
                <span className="flex-1 text-[11px] uppercase tracking-[0.04em] text-[var(--ma-t3)]">
                  {t("meetingsHeading")}
                </span>
              </div>

              <form onSubmit={addBot} className="mb-2.5 px-1">
                <div className="flex gap-1.5">
                  <input
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    aria-invalid={linkNotInCalendar}
                    aria-describedby={
                      linkNotInCalendar ? "assistant-link-hint" : undefined
                    }
                    placeholder={t("linkPlaceholder")}
                    className="min-w-0 flex-1 rounded-[7px] border border-[var(--ma-line2)] bg-[var(--ma-panel)] px-2 py-1.5 text-xs text-[var(--ma-t1)] outline-none placeholder:text-[var(--ma-t3)]"
                  />
                  <button
                    type="submit"
                    disabled={
                      !meetingUrl.trim() || botStatus === BotStatus.Sending
                    }
                    className="shrink-0 rounded-[7px] px-2.5 text-xs font-semibold disabled:cursor-default"
                    style={{
                      background: meetingUrl.trim()
                        ? "var(--ma-accent)"
                        : "var(--ma-panel2)",
                      color: meetingUrl.trim()
                        ? "var(--ma-on-accent)"
                        : "var(--ma-t3)",
                    }}
                  >
                    {botStatus === BotStatus.Sending ? "…" : t("addBot")}
                  </button>
                </div>
                {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                {linkNotInCalendar ? (
                  <p
                    id="assistant-link-hint"
                    role="alert"
                    className="mt-1.5 text-[11px] leading-snug text-[var(--ma-danger)]"
                  >
                    {t("linkNotInCalendar")}
                  </p>
                ) : null}
                <BotStatusRenderer status={botStatus} error={botError} />
              </form>

              <ul className="space-y-0.5">
                {meetings.length === 0 ? (
                  <li className="px-2.5 py-3 text-[12px] leading-relaxed text-[var(--ma-t3)]">
                    {isLoadingMeetings ? t("loadingMeetings") : t("noMeetings")}
                  </li>
                ) : null}
                {meetings.map((m) => {
                  const meta = STATUS_META[m.status];
                  const on = m.id === selected?.id;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className="w-full rounded-lg px-2.5 py-2 text-left transition-colors"
                        style={{
                          background: on ? "var(--ma-panel2)" : "transparent",
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium text-[var(--ma-t1)]">
                              {m.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-[var(--ma-t3)]">
                              {m.platform} · {m.when}
                            </span>
                          </span>
                          <span
                            className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ color: meta.color, background: meta.bg }}
                          >
                            {t(`status.${m.status}`)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--ma-line)] px-3 py-2">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--ma-panel2)] text-[11px] font-semibold text-[var(--ma-t1)]">
                {initials(session?.fullName ?? "") || "K"}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[12.5px] font-medium text-[var(--ma-t1)]">
                  {session?.fullName ?? t("userFallback")}
                </span>
                <span className="block truncate text-[11px] text-[var(--ma-t3)]">
                  {session?.organizationName ?? ""}
                </span>
              </span>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[var(--ma-bg)]">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[var(--ma-t3)]">
                {isLoadingMeetings ? t("loadingMeetings") : t("pickMeeting")}
              </div>
            ) : (
              <>
                <header className="shrink-0 border-b border-[var(--ma-line)] bg-[var(--ma-sidebar)] px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {selected.status === MeetingStatus.Active ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ma-green)]">
                            <span className="size-[7px] rounded-full bg-[var(--ma-green)] shadow-[0_0_0_3px_var(--ma-greenbg)]" />
                            {t("live")}
                          </span>
                        ) : (
                          <span
                            className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              color: status.color,
                              background: status.bg,
                            }}
                          >
                            {t(`status.${selected.status}`)}
                          </span>
                        )}
                        <h2 className="truncate text-sm font-semibold text-[var(--ma-t1)]">
                          {selected.title}
                        </h2>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-[var(--ma-t3)]">
                        {selected.platform} · {selected.participants.join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={targetMeetingId}
                        onChange={(e) => setTargetMeetingId(e.target.value)}
                        aria-label={t("notebookMeeting")}
                        className="h-8 max-w-[220px] rounded-[7px] border border-[var(--ma-line)] bg-[var(--ma-panel)] px-2 text-[11.5px] text-[var(--ma-t1)]"
                      >
                        <option value="">{t("pickNotebook")}</option>
                        {platformMeetings.map((meeting) => (
                          <option key={meeting.id} value={meeting.id}>
                            {meeting.agenda ?? t("meetingFallback")} ·{" "}
                            {formatSlotDateTime(meeting.scheduledAt, locale)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void sendTranscript()}
                        disabled={
                          !targetMeetingId ||
                          visibleTranscript.every(
                            (line) => !line.text.trim(),
                          ) ||
                          shareStatus === BotStatus.Sending
                        }
                        title={t("sendTranscriptHint")}
                        className="rounded-[7px] border border-[var(--ma-line2)] px-2.5 py-1 text-xs font-semibold text-[var(--ma-t1)] disabled:opacity-50"
                      >
                        {t("sendTranscript")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void sendReport()}
                        disabled={
                          !targetMeetingId ||
                          !meetingReport ||
                          shareStatus === BotStatus.Sending
                        }
                        className="rounded-[7px] bg-[var(--ma-accent)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {t("sendReport")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void stopBot()}
                        disabled={
                          botStatus === BotStatus.Sending ||
                          !selected.platformKey ||
                          !selected.nativeMeetingId
                        }
                        className="rounded-[7px] border border-[var(--ma-danger)] px-2.5 py-1 text-xs font-semibold text-[var(--ma-danger)] disabled:opacity-50"
                      >
                        {t("stop")}
                      </button>
                    </div>
                  </div>
                  <MeetingBotNoticeLine
                    notice={botNotice}
                    tone={botNoticeTone}
                  />
                  {selected.status === MeetingStatus.Active ||
                  selected.status === MeetingStatus.Joining ||
                  selected.status === MeetingStatus.Scheduled ? (
                    <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--ma-t2)]">
                      {t.rich("stopHint", {
                        b: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                  ) : null}
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                  <div className="w-full">
                    <div className="mb-5 flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                        {t("transcript")}
                      </span>
                      <span className="font-mono text-[10.5px] text-[var(--ma-t3)]">
                        {visibleTranscript.length}
                      </span>
                      {canEditTranscript ? (
                        <span className="text-[11px] text-[var(--ma-t3)]">
                          {t("editable")}
                        </span>
                      ) : null}
                      <span className="h-px flex-1 bg-[var(--ma-line)]" />
                    </div>
                    {shareError ? (
                      <p className="mb-3 text-[11px] text-[var(--ma-danger)]">
                        {shareError}
                      </p>
                    ) : shareStatus === BotStatus.Ok ? (
                      <p className="mb-3 text-[11px] text-[var(--ma-green)]">
                        {t("shared")}
                      </p>
                    ) : null}

                    {visibleTranscript.length === 0 ? (
                      <p className="text-[12.5px] leading-relaxed text-[var(--ma-t3)]">
                        {selected.status === MeetingStatus.Active ||
                        selected.status === MeetingStatus.Joining
                          ? t("emptyLive")
                          : t("emptyIdle")}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {visibleTranscript.map((line) => (
                          <div key={line.id} className="min-w-0">
                            {canEditTranscript ? (
                              <>
                                <input
                                  value={line.speaker}
                                  onChange={(e) =>
                                    updateTranscriptLine(line.id, {
                                      speaker: e.target.value,
                                    })
                                  }
                                  aria-label={t("speaker")}
                                  className="w-full rounded-md border border-[var(--ma-line)] bg-white px-2 py-1 text-[12px] font-medium text-[var(--ma-blue)] outline-none focus:border-[var(--ma-accent)]"
                                />
                                <textarea
                                  value={line.text}
                                  onChange={(e) =>
                                    updateTranscriptLine(line.id, {
                                      text: e.target.value,
                                    })
                                  }
                                  aria-label={t("line")}
                                  rows={2}
                                  className="mt-1 w-full resize-y rounded-md border border-[var(--ma-line)] bg-white px-2 py-1.5 text-[13px] leading-relaxed text-[var(--ma-t1)] outline-none focus:border-[var(--ma-accent)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTranscriptLine(line.id)}
                                  className="mt-1 text-[11px] text-[var(--ma-danger)]"
                                >
                                  {t("deleteLine")}
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="text-[12px] font-medium text-[var(--ma-blue)]">
                                  {line.speaker}
                                </div>
                                <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ma-t1)]">
                                  {line.text}
                                </p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-8">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                          {t("report")}
                        </span>
                        <span className="h-px flex-1 bg-[var(--ma-line)]" />
                        {canReport ? (
                          <button
                            type="button"
                            onClick={() => regenerateReport()}
                            disabled={
                              reportStatus === BotStatus.Sending ||
                              !selected.platformKey ||
                              !selected.nativeMeetingId
                            }
                            className="rounded-[7px] border border-[var(--ma-line2)] px-2 py-0.5 text-[11px] font-medium text-[var(--ma-t2)] disabled:opacity-50"
                          >
                            {reportStatus === BotStatus.Sending
                              ? t("generating")
                              : t("generate")}
                          </button>
                        ) : null}
                      </div>
                      <BotStatusRenderer
                        status={reportStatus}
                        error={reportError}
                      />
                      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                      {canEditTranscript && meetingReport ? (
                        <p className="mb-2 text-[11px] text-[var(--ma-t3)]">
                          {t("reportFromRecording")}
                        </p>
                      ) : null}
                      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                      {meetingReport ? (
                        <MeetingReportView report={meetingReport} />
                      ) : (
                        <p className="text-[12.5px] leading-relaxed text-[var(--ma-t3)]">
                          {canReport ? t("reportEmpty") : t("reportOff")}
                        </p>
                      )}
                    </div>

                    <div className="mt-8">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                          {t("summary")}
                        </span>
                        <span className="h-px flex-1 bg-[var(--ma-line)]" />
                      </div>
                      <ul className="space-y-2">
                        {notes.map((note) => (
                          <li
                            key={note}
                            className="flex gap-2 rounded-lg border border-[var(--ma-line)] bg-[var(--ma-panel)] px-3 py-2 text-[12.5px] text-[var(--ma-t1)]"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ma-accent)]" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
