"use client";

import { ArrowLeft, Check, Lock } from "lucide-react";
import Link from "next/link";

import { ApplicationStatusTimeline } from "@/components/auth/application-status-timeline";
import {
  MENTOR_STEP_LABELS,
  MENTOR_STEP_ORDER,
  PROGRAM_STAGES,
  type MentorOnboardingDraft,
} from "@/interfaces/mentor-onboarding";
import { UserAccountStatus } from "@/interfaces/session";

const EMPTY = "—";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#f1f2f4] py-3 last:border-b-0">
      <dt className="text-[11px] uppercase tracking-wider text-[#a4aab2]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[#22262b]">{value}</dd>
    </div>
  );
}

export function MentorCompleteView({
  draft,
}: {
  draft: MentorOnboardingDraft;
}) {
  const stageLabels = PROGRAM_STAGES.filter((stage) =>
    draft.programStages.includes(stage.id),
  )
    .map((stage) => stage.label)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5">
      <ol className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {MENTOR_STEP_ORDER.map((step) => (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid size-5 place-items-center rounded-full bg-[#e86f22] text-white"
            >
              <Check className="size-3" />
            </span>
            <span className="text-xs text-[#676e78]">
              {MENTOR_STEP_LABELS[step]}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-6 text-center">
        <span
          aria-hidden
          className="mx-auto grid size-12 place-items-center rounded-full bg-[#fdebdd]"
        >
          <Check className="size-6 text-[#c85816]" />
        </span>
        <h1 className="mt-4 text-[22px] font-semibold tracking-tight">
          Başvurunuz onay için gönderildi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#676e78]">
          Mentor profiliniz koordinatör incelemesine alındı. Onaylandıktan sonra
          e-posta ile bilgilendirileceksiniz; o zamana kadar panele
          giremezsiniz.
        </p>
        <span className="mt-4 inline-flex rounded-full bg-[#fdebdd] px-2.5 py-1 text-[11px] font-semibold text-[#c85816]">
          Koordinatör incelemesinde
        </span>
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
          Süreç
        </h2>
        <ApplicationStatusTimeline status={UserAccountStatus.Pending} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Profil özeti</h2>
        <dl className="mt-2">
          <SummaryRow
            label="Uzmanlıklarınız"
            value={draft.expertise.join(" · ") || EMPTY}
          />
          <SummaryRow
            label="Destek verebileceğiniz konular"
            value={draft.supportTopics.join(" · ") || EMPTY}
          />
          <SummaryRow
            label="Çalışmak istediğiniz aşamalar"
            value={stageLabels || EMPTY}
          />
          <SummaryRow
            label="Aynı anda çalışabileceğiniz girişim"
            value={draft.capacity}
          />
        </dl>
      </section>

      <p className="flex items-start gap-2.5 rounded-2xl bg-[#f1f2f4] p-4 text-xs leading-relaxed text-[#676e78]">
        <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
        İnceleme bitene kadar panele veya profile gidemezsiniz. Onay sonrası
        giriş yaparak mentor çalışma alanını açabilirsiniz.
      </p>

      <Link
        href="/application-status"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#e86f22] px-4 text-sm font-semibold text-white transition hover:bg-[#ce5e19]"
      >
        Başvuru durumunu görüntüle
      </Link>
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#e86f22] hover:text-[#c85816]"
      >
        <ArrowLeft className="size-3.5" />
        Ana sayfaya dön
      </Link>
    </div>
  );
}
