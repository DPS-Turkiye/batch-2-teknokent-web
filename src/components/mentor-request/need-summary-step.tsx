import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { NeedWizardStepper } from "@/components/mentor-request/need-wizard-stepper";

export function NeedSummaryStep({
  startupLine,
  needTitle,
  problem,
  outcome,
  expertise,
  onEditNeed,
  onEditProblem,
  onEditOutcome,
  onSelectStep,
}: {
  startupLine: string;
  needTitle: string;
  problem: string;
  outcome: string;
  expertise: readonly string[];
  onEditNeed: () => void;
  onEditProblem: () => void;
  onEditOutcome: () => void;
  onSelectStep?: (index: number) => void;
}) {
  const t = useTranslations("mentorRequest.summaryStep");
  return (
    <div>
      <NeedWizardStepper current={3} onSelectStep={onSelectStep} />

      <h1 className="mt-8 text-[30px] font-semibold leading-tight text-[#676e78]">
        {t("heading")}
      </h1>
      <p className="mt-1.5 text-sm text-[#676e78]">{t("hint")}</p>

      {startupLine ? (
        <div className="mt-6 flex min-h-[54px] items-center justify-between gap-4 rounded-lg border border-[#e4e7ea] bg-[#fcfcfd] px-4 py-3">
          <p className="text-[13px] font-medium text-[#676e78]">
            {startupLine}
          </p>
          <p className="shrink-0 text-xs text-[#858c96]">{t("fromProfile")}</p>
        </div>
      ) : null}

      <SummaryCard
        label={t("need")}
        onEdit={onEditNeed}
        editLabel={t("editNeed")}
      >
        <p className="text-lg font-semibold text-[#22262b]">{needTitle}</p>
      </SummaryCard>

      <SummaryCard
        label={t("problem")}
        onEdit={onEditProblem}
        editLabel={t("editProblem")}
      >
        <p className="text-sm leading-6 text-[#22262b]">{problem}</p>
      </SummaryCard>

      <SummaryCard
        label={t("outcome")}
        onEdit={onEditOutcome}
        editLabel={t("editOutcome")}
      >
        <p className="whitespace-pre-line text-sm leading-6 text-[#22262b]">
          {outcome}
        </p>
      </SummaryCard>

      {expertise.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#22262b]">{t("expertise")}</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {expertise.map((tag) => (
              <span
                key={tag}
                className="inline-flex min-h-8 items-center rounded-2xl border border-[#e86f22] bg-[#fdede0] px-3.5 text-xs font-medium text-[#e86f22]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  onEdit,
  editLabel,
  children,
}: {
  label: string;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  const t = useTranslations("mentorRequest.summaryStep");
  return (
    <section className="relative mt-3 rounded-[10px] border border-[#e4e7ea] bg-white px-4 py-4 pr-20">
      <p className="text-[13px] font-medium text-[#676e78]">{label}</p>
      <div className="mt-2">{children}</div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="absolute right-4 top-4 text-xs font-medium text-[#e86f22] hover:underline"
      >
        {t("edit")}
      </button>
    </section>
  );
}
