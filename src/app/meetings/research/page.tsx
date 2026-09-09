"use client";

import { ArrowRight, CheckCircle2, Video } from "lucide-react";
import { Suspense } from "react";

import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function MeetingDetailContent() {
  const {
    error,
    isLoading,
    isSaving,
    meeting,
    notes,
    outcomes,
    saveNotes,
    setNotes,
    setOutcomes,
  } = useMeetingLifecycle();

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Meetings}
        title="Mentorluk Görüşmesi"
        backHref="/dashboard"
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  const mentorName = meeting.mentorName ?? "Mentor";

  return (
    <AppShell
      active={AppArea.Meetings}
      title="Mentorluk Görüşmesi"
      backHref="/dashboard"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
        <section className="flex flex-col gap-5 rounded-3xl border border-[#e4e7ea] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <Avatar initials={initials(mentorName)} size="lg" tone="orange" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e86f22]">
              {isLoading ? "Toplantı yükleniyor" : "Görüşme başladı"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#22262b]">
              {mentorName} ile Mentorluk Görüşmesi
            </h1>
            <p className="mt-1 text-sm text-[#676e78]">
              {meeting.agenda ?? "Bu görüşme için gündem eklenmemiş."}
            </p>
            <p className="mt-2 text-xs text-[#858c96]">
              {new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(meeting.scheduledAt))}{" "}
              · {meeting.durationMinutes} dk
            </p>
          </div>
          {meeting.meetLink ? (
            <a
              href={meeting.meetLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19]"
            >
              <Video className="size-4" /> Google Meet’e katıl
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-xl border border-[#e4e7ea] px-5 text-xs text-[#858c96]">
              Görüşme bağlantısı bekleniyor
            </span>
          )}
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <h2 className="text-base font-semibold">Bugünkü gündem</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#676e78]">
                {meeting.agenda ?? "Bu görüşme için gündem eklenmemiş."}
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Görüşme notları</h2>
                <p className="mt-1 text-xs text-[#858c96]">
                  Toplantı sırasında önemli noktaları kaydet.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf8f1] px-3 py-1.5 text-[11px] font-semibold text-[#23824b]">
                <CheckCircle2 className="size-3.5" /> Canlı
              </span>
            </div>
            <label className="mt-5 block text-xs font-semibold text-[#515861]">
              Konuşulan önemli noktalar
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-40 w-full resize-y rounded-xl border border-[#dfe2e6] bg-[#fcfcfd] p-4 text-sm font-normal leading-6 outline-none"
                placeholder="Görüşme notlarını buraya yaz…"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold text-[#515861]">
              Kararlar ve beklenen sonuçlar
              <textarea
                value={outcomes}
                onChange={(event) => setOutcomes(event.target.value)}
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#dfe2e6] bg-[#fcfcfd] p-4 text-sm font-normal leading-6 outline-none"
                placeholder="Alınan kararları yaz…"
              />
            </label>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveNotes()}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor…" : "Görüşme özetini tamamla"}{" "}
              <ArrowRight className="size-4" />
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default function MeetingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          Toplantı yükleniyor…
        </div>
      }
    >
      <MeetingDetailContent />
    </Suspense>
  );
}
