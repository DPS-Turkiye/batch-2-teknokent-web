"use client";

import { ArrowRight, CheckCircle2, Save } from "lucide-react";
import { Suspense } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  MEETING_ACTIONS,
  useMeetingLifecycle,
} from "@/hooks/use-meeting-lifecycle";
import { AppArea } from "@/types/app-area";

const actionDueDates = [
  "29 Ağustos",
  "30 Ağustos",
  "31 Ağustos",
  "2 Eylül",
] as const;

function MeetingSummaryContent() {
  const {
    completedActions,
    completeMeeting,
    isSaving,
    meeting,
    notes,
    outcomes,
    toggleAction,
  } = useMeetingLifecycle();

  return (
    <AppShell
      active={AppArea.Meetings}
      title="Görüşme Özeti"
      backHref="/meetings/research"
    >
      <div className="mx-auto w-full max-w-[1060px] px-4 pb-14 pt-8 sm:px-8">
        <p className="text-sm font-medium text-[#e86f22]">
          Çağrı Yılmaz · {meeting.durationMinutes} dk
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Görüşme notlarını tamamla
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#676e78]">
          Toplantıda aldığın notları kontrol et. Kararları ve sonraki
          aksiyonları netleştirerek görüşmeyi tamamla.
        </p>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-6">
            <h2 className="text-base font-semibold">1. Konuşulanlar</h2>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fff9f5] p-4 text-sm leading-6 text-[#515861]">
              {notes || "Görüşme notu eklenmedi."}
            </p>
            <h2 className="mt-7 text-base font-semibold">2. Alınan kararlar</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#515861]">
              {outcomes || "Karar eklenmedi."}
            </p>
            <h2 className="mt-7 text-base font-semibold">3. Aksiyonlar</h2>
            <div className="mt-3 divide-y divide-[#eef0f2] rounded-xl border border-[#e4e7ea]">
              {MEETING_ACTIONS.map((action, index) => (
                <label
                  key={action}
                  className="flex cursor-pointer items-start gap-3 p-4"
                >
                  <input
                    type="checkbox"
                    checked={completedActions.has(action)}
                    onChange={() => toggleAction(action)}
                    className="mt-0.5 size-4 accent-[#e86f22]"
                  />
                  <span className="text-sm font-medium">
                    {action}
                    <small className="mt-1 block font-normal text-[#858c96]">
                      Sorumlu: Gülse · Termin: {actionDueDates[index]}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <h2 className="mt-7 text-base font-semibold">
              4. Sonraki görüşmede
            </h2>
            <p className="mt-2 text-sm text-[#676e78]">
              Pricing senaryoları ve runway çıktıları değerlendirilecek.
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-[#e86f22] p-5 text-white shadow-[0_16px_35px_rgba(232,111,34,.18)]">
              <CheckCircle2 className="size-7" />
              <h2 className="mt-4 text-lg font-semibold">Görüşme çıktısı</h2>
              <dl className="mt-4 space-y-3 text-sm text-white/85">
                <div className="flex justify-between">
                  <dt>Aksiyon</dt>
                  <dd className="font-semibold text-white">
                    {MEETING_ACTIONS.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tamamlanan</dt>
                  <dd className="font-semibold text-white">
                    {completedActions.size}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Sonraki konu</dt>
                  <dd className="font-semibold text-white">1</dd>
                </div>
              </dl>
            </section>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void completeMeeting()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor…" : "Görüşmeyi tamamla"}{" "}
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e4e7ea] bg-white px-5 text-sm font-semibold text-[#515861] hover:border-[#f2b78f]"
            >
              <Save className="size-4" /> Taslak olarak bırak
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function MeetingSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          Görüşme özeti yükleniyor…
        </div>
      }
    >
      <MeetingSummaryContent />
    </Suspense>
  );
}
