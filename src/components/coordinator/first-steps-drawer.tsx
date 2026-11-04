"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Avatar, StatusChip } from "@/components/admin/admin-ui";
import { ProposeMeetingDialog } from "@/components/propose-meeting-dialog";
import { useMentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import { coordinatorMessageHref } from "@/lib/coordinator-mentorships";
import { introStep, StepState } from "@/lib/meeting-proposals";
import type { FirstSteps } from "@/lib/program-matching";
import { initials } from "@/lib/utils";

/** What happens right after a match, and the first meeting's status. */
export function FirstStepsDrawer({
  programId,
  steps,
  onClose,
}: {
  programId: string;
  steps: FirstSteps;
  onClose: () => void;
}) {
  const t = useTranslations("firstSteps");
  const locale = useLocale();
  const tProposals = useTranslations("meetingProposals");
  const proposals = useMentorshipMeetingProposals(steps.mentorshipId);
  const intro = introStep(proposals.latest, { t: tProposals, locale });
  const matchedAt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(steps.matchedAt));
  const done = 2 + (intro.state === StepState.Done ? 1 : 0);
  const pair = `${steps.mentorName} ↔ ${steps.teamName}`;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#22262b]/20">
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="relative m-3 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <header className="flex items-start gap-3 px-7 pt-7">
          <span className="flex -space-x-1.5">
            <Avatar
              initials={initials(steps.mentorName)}
              tone="blue"
              size="lg"
            />
            <Avatar initials={initials(steps.teamName)} size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 text-[19px] font-semibold text-[#22262b]">
              {pair} <StatusChip tone="neutral">{t("new")}</StatusChip>
            </h2>
            <p className="mt-1 text-[12.5px] text-[#858c96]">
              {t("matchedToday")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-9 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78]"
          >
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-7 py-6">
          <section>
            <h3 className="text-[12px] font-medium uppercase tracking-wide text-[#858c96]">
              {t("progress", { done })}
            </h3>
            <ol className="mt-3 divide-y divide-[#eef0f2] rounded-2xl border border-[#e9ecef]">
              <Step
                state={StepState.Done}
                title={t("matched")}
                detail={t("matchedAt", { time: matchedAt })}
              />
              <Step
                state={StepState.Done}
                title={t("notified")}
                detail={[
                  steps.mentorName,
                  steps.leadName
                    ? t("lead", { name: steps.leadName })
                    : t("team"),
                ].join(", ")}
              />
              <Step
                state={intro.state}
                title={t("intro")}
                detail={intro.detail}
                action={
                  intro.state === StepState.Waiting ? (
                    <StepButton
                      onClick={proposals.remind}
                      disabled={proposals.reminding || proposals.reminded}
                    >
                      {proposals.reminded ? t("reminded") : t("remind")}
                    </StepButton>
                  ) : intro.state === StepState.Todo ? (
                    <StepButton onClick={proposals.openComposer}>
                      {t("plan")}
                    </StepButton>
                  ) : null
                }
              />
              <Step
                state={StepState.Todo}
                title={t("firstNote")}
                detail={t("firstNoteDetail")}
              />
            </ol>
            {proposals.actionError ? (
              <p className="mt-2 text-[12px] text-[#d9464b]">
                {proposals.actionError.message}
              </p>
            ) : null}
          </section>

          <section>
            <h3 className="text-[12px] font-medium uppercase tracking-wide text-[#858c96]">
              {t("parties")}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#eaf6ff] px-4 py-3">
                <p className="text-[13.5px] font-medium text-[#22262b]">
                  {steps.mentorName}
                </p>
                <p className="text-[12px] text-[#1583d6]">
                  {t("mentorLoad", { load: steps.mentorLoad })}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff1ec] px-4 py-3">
                <p className="text-[13.5px] font-medium text-[#22262b]">
                  {steps.teamName}
                </p>
                <p className="text-[12px] text-[#e0522a]">
                  {steps.leadName
                    ? t("teamWithLead", { name: steps.leadName })
                    : t("teamLabel")}
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#eef0f2] px-7 py-4">
          <Link
            href="/coordinator/calendar"
            className="text-[13px] font-medium text-[#22262b]"
          >
            {t("calendar")}
          </Link>
          <Link
            href={coordinatorMessageHref(programId, steps.mentorId)}
            className="inline-flex h-10 items-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
          >
            {t("message")}
          </Link>
        </footer>
        <ProposeMeetingDialog proposals={proposals} pairLabel={pair} />
      </section>
    </div>
  );
}

function Step({
  state,
  title,
  detail,
  action,
}: {
  state: StepState;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3" data-state={state}>
      {state === StepState.Done ? (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#1f8a4c] text-white">
          <Check aria-hidden className="size-3.5" />
        </span>
      ) : state === StepState.Waiting ? (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#fff4e0]">
          <span className="size-2 rounded-full bg-[#b7791f]" />
        </span>
      ) : (
        <span className="size-6 shrink-0 rounded-full border border-[#d5d9de]" />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13.5px] ${state === StepState.Todo ? "text-[#858c96]" : "text-[#22262b]"}`}
        >
          {title}
        </span>
        <span className="block text-[12px] text-[#858c96]">{detail}</span>
      </span>
      {action}
    </li>
  );
}

function StepButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#e9ecef] px-3 text-[12.5px] text-[#22262b] disabled:text-[#aeb4bc]"
    >
      {children}
    </button>
  );
}
