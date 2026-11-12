"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import type { ProfileCompletionStep } from "@/interfaces/student-profile-completion";
import { CompletionStepState } from "@/types/profile-completion";

/**
 * "Adımlar" (Figma "Profil Tamamlama"): the steps as a vertical card beside the form, the current one marked with
 * the accent edge. The kit's `StepPills` is the horizontal strip of other wizards; this design stacks them.
 */
export function CompletionStepper({
  steps,
  current,
}: {
  steps: { step: ProfileCompletionStep; state: CompletionStepState }[];
  current: ProfileCompletionStep;
}) {
  const t = useTranslations("iaProfile");
  return (
    <aside className="flex w-full flex-col gap-1 rounded-[20px] border border-border-subtle bg-background-surface p-4 lg:w-[300px] lg:shrink-0">
      <p className="type-overline text-text-muted">
        {t("progress", { current: current + 1, total: steps.length })}
      </p>
      <ol className="flex flex-col gap-1">
        {steps.map(({ step, state }) => (
          <li
            key={step}
            aria-current={
              state === CompletionStepState.Current ? "step" : undefined
            }
            className={`flex items-center gap-3 p-3 ${
              state === CompletionStepState.Current
                ? "rounded-[4px] border-r-[3px] border-border-selected"
                : "rounded-[14px]"
            }`}
          >
            <StepMarker step={step} state={state} />
            <span className="flex flex-col gap-0.5">
              <span
                className={`type-label ${
                  state === CompletionStepState.Upcoming
                    ? "text-text-muted"
                    : "text-text-primary"
                }`}
              >
                {t(`stepNames.${step}.title`)}
              </span>
              <span className="type-caption text-text-muted">
                {t(`stepNames.${step}.hint`)}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="rounded-[12px] bg-background-subtle p-3 type-caption text-text-secondary">
        {t("duration")}
      </p>
    </aside>
  );
}

function StepMarker({
  step,
  state,
}: {
  step: ProfileCompletionStep;
  state: CompletionStepState;
}) {
  const t = useTranslations("iaProfile");
  if (state === CompletionStepState.Done) {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-action-primary-bg">
        <Image
          src="/ia/profile/step-done.svg"
          alt={t("stepDone")}
          width={16}
          height={16}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`grid size-7 shrink-0 place-items-center rounded-full type-label-sm ${
        state === CompletionStepState.Current
          ? "bg-action-primary-bg text-text-inverse"
          : "bg-background-muted text-text-muted"
      }`}
    >
      {step + 1}
    </span>
  );
}
