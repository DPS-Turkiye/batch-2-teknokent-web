"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import type { ProfileCompletionStep } from "@/interfaces/student-profile-completion";
import { CompletionStepState } from "@/types/profile-completion";

/** "Adımlar": the three steps, the current one marked with the ODTÜ red edge. */
export function CompletionStepper({
  steps,
  current,
}: {
  steps: { step: ProfileCompletionStep; state: CompletionStepState }[];
  current: ProfileCompletionStep;
}) {
  const t = useTranslations("studentProfileCompletion");
  return (
    <aside className="flex w-full flex-col gap-1 rounded-[20px] border border-[#e5e9ed] bg-white p-4 lg:w-[300px] lg:shrink-0">
      <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.88px] text-[#6e7681]">
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
                ? "rounded-[4px] border-r-[3px] border-[#d0112b]"
                : "rounded-[14px]"
            }`}
          >
            <StepMarker step={step} state={state} />
            <span className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-medium leading-5 tracking-[-0.014px] ${
                  state === CompletionStepState.Upcoming
                    ? "text-[#6e7681]"
                    : "text-[#1c2026]"
                }`}
              >
                {t(`stepNames.${step}.title`)}
              </span>
              <span className="text-xs leading-4 text-[#6e7681]">
                {t(`stepNames.${step}.hint`)}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="rounded-[12px] bg-[#f4f6f8] p-3 text-xs leading-4 text-[#575f69]">
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
  const t = useTranslations("studentProfileCompletion");
  if (state === CompletionStepState.Done) {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d0112b]">
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
      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium leading-4 ${
        state === CompletionStepState.Current
          ? "bg-[#d0112b] text-white"
          : "bg-[#edf0f3] text-[#6e7681]"
      }`}
    >
      {step + 1}
    </span>
  );
}
