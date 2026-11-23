// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { StatusChip } from "@/components/admin/admin-ui";
import {
  EmailStepState,
  type EmailStep as EmailStepName,
} from "@/types/email-center";

const TONES = {
  [EmailStepState.Done]: "green",
  [EmailStepState.Current]: "blue",
  [EmailStepState.Waiting]: "neutral",
} as const;

/** One numbered step of writing a mail, with whether it is done, next or waiting for the ones before. */
export function EmailStep({
  number,
  step,
  state,
  children,
}: {
  number: number;
  step: EmailStepName;
  state: EmailStepState;
  children: ReactNode;
}) {
  const t = useTranslations("emailCenter");
  const headingId = useId();
  return (
    <li
      aria-current={state === EmailStepState.Current ? "step" : undefined}
      className="rounded-[28px] border border-[#e9ecef] bg-white p-5 sm:p-6"
    >
      <section aria-labelledby={headingId} className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
              state === EmailStepState.Done
                ? "bg-[#eaf7f0] text-[#2f9e6b]"
                : state === EmailStepState.Current
                  ? "bg-[#22262b] text-white"
                  : "bg-[#f4f5f7] text-[#676e78]"
            }`}
          >
            {state === EmailStepState.Done ? (
              <Check className="size-4" />
            ) : (
              number
            )}
          </span>
          <h2
            id={headingId}
            className="flex-1 text-[17px] font-semibold text-[#22262b]"
          >
            {t(`steps.${step}`)}
          </h2>
          <StatusChip tone={TONES[state]}>
            {t(`stepStates.${state}`)}
          </StatusChip>
        </div>
        {children}
      </section>
    </li>
  );
}
