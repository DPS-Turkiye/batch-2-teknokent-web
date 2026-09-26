"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  useOpenIntervention,
  useResolveIntervention,
} from "@/hooks/use-admin-interventions";
import {
  INTERVENTION_ACTION,
  type AdminIntervention,
} from "@/interfaces/admin-intervention";
import { errorMessage, initials } from "@/lib/utils";

export function NotifyInterventionDialog({
  coordinatorName,
  pair,
  programName,
  signals,
  mentorshipId,
  onClose,
  onOpened,
}: {
  coordinatorName: string;
  pair: string;
  programName: string;
  signals: { label: string; value: string }[];
  mentorshipId: string;
  onClose: () => void;
  onOpened: () => void;
}) {
  const open = useOpenIntervention();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await open.mutateAsync({
        mentorshipId,
        action: INTERVENTION_ACTION,
        note,
      });
      onOpened();
    } catch (caught) {
      setError(errorMessage(caught, "Bildirim gönderilemedi."));
    }
  }

  return (
    <AdminOverlay label={`${coordinatorName} için bildirim`} onClose={onClose}>
      <form
        className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.16)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-start gap-3 px-7 pt-7">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] leading-[1.3] font-semibold text-[#22262b]">
              {coordinatorName} için bildirim
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.45] text-[#676e78]">
              {pair} · {programName}. Koordinatöre uygulama içi bildirim gider
              ve bu mentorluk takibe alınır.
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#676e78]"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-7 py-5">
          <section className="rounded-2xl bg-[#f7f8fa] px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-[#858c96]">
              SİNYALLER
            </p>
            <dl className="mt-2 space-y-2">
              {signals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-start justify-between gap-4 text-[13px]"
                >
                  <dt className="text-[#676e78]">{signal.label}</dt>
                  <dd className="text-right font-medium text-[#22262b]">
                    {signal.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <p className="text-[12.5px] font-medium text-[#22262b]">
              Önerilen aksiyon
            </p>
            <p className="mt-2 rounded-2xl border border-[#f0b9b5] bg-[#fff5f4] px-4 py-3 text-[13.5px] font-medium text-[#9f2d26]">
              {INTERVENTION_ACTION}
            </p>
            <p className="mt-1.5 text-[12px] text-[#858c96]">
              Bu bir hatırlatma metnidir. Süre dolunca kendiliğinden kapanmaz.
            </p>
          </section>
          <label className="block text-[12.5px] font-medium text-[#676e78]">
            Not
            <textarea
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1.5 min-h-20 w-full rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
            />
          </label>
          {error ? <p className="text-[13px] text-[#d9464b]">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2.5 border-t border-[#f0f2f4] px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={open.isPending}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {open.isPending ? "Gönderiliyor…" : "Bildir ve takibe al"}
          </button>
        </div>
      </form>
    </AdminOverlay>
  );
}

export function InterventionDrawer({
  intervention,
  mentorName,
  teamName,
  programName,
  signals,
  onClose,
  onResolved,
}: {
  intervention: AdminIntervention;
  mentorName: string;
  teamName: string;
  programName: string;
  signals: { label: string; value: string; alert?: boolean }[];
  onClose: () => void;
  onResolved: () => void;
}) {
  const resolve = useResolveIntervention();
  const [error, setError] = useState<string | null>(null);
  const steps = [
    {
      title: "Koordinatöre bildirildi",
      detail: `${intervention.openedByName} · ${stamp(intervention.openedAt)}`,
      done: true,
    },
    {
      title: "Koordinatör gördü",
      detail: intervention.readAt
        ? `${intervention.coordinatorName} · ${stamp(intervention.readAt)}`
        : "Henüz bildirimi açmadı",
      done: intervention.readAt != null,
    },
    {
      title: "Görüşme planlandı",
      detail: intervention.plannedMeetingAt
        ? stamp(intervention.plannedMeetingAt)
        : "Bildirimden sonra planlanmış görüşme yok",
      done: intervention.plannedMeetingAt != null,
    },
  ];
  const pair = `${mentorName} ↔ ${teamName}`;
  const firstOpen = steps.findIndex((step) => !step.done);

  return (
    <div
      className="admin-backdrop-in fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label={`${pair} takibi`}
        className="admin-drawer-in flex h-full w-full max-w-[460px] flex-col rounded-l-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex shrink-0 items-center pt-0.5">
              <span className="grid size-9 place-items-center rounded-full bg-[#eaf6ff] text-[11px] font-semibold text-[#1583d6] ring-2 ring-white">
                {mark(mentorName)}
              </span>
              <span className="-ml-2.5 grid size-9 place-items-center rounded-full bg-[#fff1ec] text-[11px] font-semibold text-[#e0522a] ring-2 ring-white">
                {mark(teamName)}
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[18px] font-semibold text-[#22262b]">
                  {pair}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f3ff] px-2 py-0.5 text-[11.5px] font-medium text-[#2f7de1]">
                  <span className="size-1.5 rounded-full bg-[#2f7de1]" />
                  Takipte
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-[#858c96]">
                Müdahale · {programName} · sorumlu:{" "}
                {intervention.coordinatorName}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#676e78]"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[#858c96]">
              ZAMAN ÇİZELGESİ
            </p>
            <ol className="mt-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex w-6 shrink-0 flex-col items-center">
                    <StepMark done={step.done} current={index === firstOpen} />
                    {index < steps.length - 1 ? (
                      <span
                        className={`my-0.5 w-px flex-1 ${
                          step.done ? "bg-[#b7dfc7]" : "bg-[#e6e8ec]"
                        }`}
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 pb-4">
                    <span className="block text-[14px] font-medium text-[#22262b]">
                      {step.title}
                    </span>
                    <span className="block text-[12.5px] text-[#858c96]">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            {intervention.note ? (
              <p className="text-[12.5px] leading-[1.45] text-[#676e78]">
                Not · {intervention.note}
              </p>
            ) : null}
          </section>
          <section>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[#858c96]">
              SİNYALLER
            </p>
            <dl className="mt-2 space-y-2.5 rounded-2xl bg-[#f7f8fa] px-4 py-3.5">
              {signals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-start justify-between gap-4 text-[13px]"
                >
                  <dt className="shrink-0 text-[#676e78]">{signal.label}</dt>
                  <dd
                    className={`text-right font-medium ${
                      signal.alert ? "text-[#d9464b]" : "text-[#22262b]"
                    }`}
                  >
                    {signal.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {error ? <p className="text-[13px] text-[#d9464b]">{error}</p> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#f0f2f4] px-6 py-4">
          <Link
            href={
              intervention.coordinatorId
                ? `/admin/users?user=${encodeURIComponent(intervention.coordinatorId)}`
                : "/admin/users"
            }
            className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
          >
            Koordinatöre git
          </Link>
          <button
            type="button"
            disabled={resolve.isPending}
            onClick={() => {
              setError(null);
              void resolve
                .mutateAsync(intervention.id)
                .then(onResolved, (caught: unknown) => {
                  setError(errorMessage(caught, "Takip kapatılamadı."));
                });
            }}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {resolve.isPending ? "Kaydediliyor…" : "Çözüldü olarak işaretle"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function mark(name: string) {
  const letters = initials(name);
  return letters.length > 1
    ? letters
    : name.slice(0, 2).toLocaleUpperCase("tr");
}

function StepMark({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="grid size-6 place-items-center rounded-full bg-[#e7f6ee] text-[#2f9e6b]">
        <Check className="size-3.5" aria-hidden />
      </span>
    );
  }
  if (current) {
    return (
      <span className="grid size-6 place-items-center">
        <span className="size-2.5 rounded-full bg-[#e0a23a]" />
      </span>
    );
  }
  return (
    <span className="grid size-6 place-items-center">
      <span className="size-2.5 rounded-full border border-[#d5d8dd]" />
    </span>
  );
}

function stamp(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
