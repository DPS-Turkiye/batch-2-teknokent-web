"use client";

import {
  STATUS_META,
  useMeetingAssistant,
} from "@/hooks/use-meeting-assistant";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingReportView } from "@/components/assistant/meeting-report-view";
import { BotStatusRenderer } from "@/components/assistant/bot-status-renderer";
import { AppArea } from "@/types/app-area";
import { BotStatus, MeetingStatus } from "@/types/assistant";
import { Calendar } from "lucide-react";

export default function AssistantPage() {
  const {
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
    regenerateReport,
  } = useMeetingAssistant();

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
                Toplantı{" "}
                <span className="font-normal text-[var(--ma-t3)]">
                  asistanı
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
                Toplantılar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="mb-1.5 flex items-center px-1">
                <span className="flex-1 text-[11px] uppercase tracking-[0.04em] text-[var(--ma-t3)]">
                  meetings
                </span>
              </div>

              <form onSubmit={addBot} className="mb-2.5 px-1">
                <div className="flex gap-1.5">
                  <input
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="Toplantı linki yapıştır…"
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
                    {botStatus === BotStatus.Sending ? "…" : "Bot ekle"}
                  </button>
                </div>
                <BotStatusRenderer status={botStatus} error={botError} />
              </form>

              <ul className="space-y-0.5">
                {meetings.map((m) => {
                  const meta = STATUS_META[m.status];
                  const on = m.id === selected.id;
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
                            {meta.label}
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
                AK
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[12.5px] font-medium text-[var(--ma-t1)]">
                  Ayşe Kaya
                </span>
                <span className="block truncate text-[11px] text-[var(--ma-t3)]">
                  NovaMed AI
                </span>
              </span>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[var(--ma-bg)]">
            <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--ma-line)] bg-[var(--ma-sidebar)] px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selected.status === MeetingStatus.Active ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ma-green)]">
                      <span className="size-[7px] rounded-full bg-[var(--ma-green)] shadow-[0_0_0_3px_var(--ma-greenbg)]" />
                      Live
                    </span>
                  ) : (
                    <span
                      className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
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
                <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-[var(--ma-line)] bg-[var(--ma-panel)] px-2 py-1 text-[11.5px] text-[var(--ma-t2)]">
                  <span className="font-mono text-[var(--ma-t3)]">stream</span>
                  <span className="text-[var(--ma-t1)]">live-stt</span>
                </span>
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
                  Stop bot
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="mx-auto max-w-3xl">
                <div className="mb-5 flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                    Transcript
                  </span>
                  <span className="font-mono text-[10.5px] text-[var(--ma-t3)]">
                    {visibleTranscript.length}
                  </span>
                  <span className="h-px flex-1 bg-[var(--ma-line)]" />
                </div>

                {visibleTranscript.length === 0 ? (
                  <p className="text-[12.5px] leading-relaxed text-[var(--ma-t3)]">
                    Henüz transcript yok. Bot toplantıya katılınca canlı
                    konuşmalar burada akacak.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {visibleTranscript.map((line) => (
                      <div key={line.id} className="flex gap-3">
                        <span className="w-10 shrink-0 pt-0.5 font-mono text-[11px] text-[var(--ma-t3)]">
                          {line.at}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-[var(--ma-blue)]">
                            {line.speaker}
                          </div>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ma-t1)]">
                            {line.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                      Toplantı raporu
                    </span>
                    <span className="h-px flex-1 bg-[var(--ma-line)]" />
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
                        ? "Üretiliyor…"
                        : "Rapor üret"}
                    </button>
                  </div>
                  <BotStatusRenderer
                    status={reportStatus}
                    error={reportError}
                  />
                  {meetingReport ? (
                    <MeetingReportView report={meetingReport} />
                  ) : (
                    <p className="text-[12.5px] leading-relaxed text-[var(--ma-t3)]">
                      Stop bot sonrası transcript’ten AI raporu burada
                      görünecek.
                    </p>
                  )}
                </div>

                <div className="mt-8">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ma-t3)]">
                      Özet
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
          </section>

          <aside className="flex w-[420px] shrink-0 flex-col border-l border-[var(--ma-line)] bg-[var(--ma-rail)] max-lg:hidden xl:w-[460px]">
            <div className="flex items-center gap-2 border-b border-[var(--ma-line)] px-4 py-2.5">
              <span className="text-[12.5px] font-medium text-[var(--ma-t1)]">
                Not defteri
              </span>
              <span className="text-[11px] text-[var(--ma-t3)]">
                · {selected.title}
              </span>
              <span className="ml-auto text-[11px] text-[var(--ma-t3)]">
                {padSaved ? "Kaydedildi" : "Boş"}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <textarea
                value={padText}
                onChange={(e) => updatePadText(e.target.value)}
                placeholder="Toplantı sırasında notlarını buraya yaz…"
                spellCheck={false}
                className="min-h-0 w-full flex-1 resize-none rounded-[10px] border border-[var(--ma-line2)] bg-[var(--ma-panel)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--ma-t1)] outline-none placeholder:text-[var(--ma-t3)] focus:border-[var(--ma-accent)]"
              />
              <p className="mt-2 text-[11px] leading-snug text-[var(--ma-t3)]">
                Notlar bu toplantıya özeldir. Değiştikçe otomatik tutulur.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
