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
  return (
    <div>
      <NeedWizardStepper current={3} onSelectStep={onSelectStep} />

      <h1 className="mt-8 text-[30px] font-semibold leading-tight text-[#676e78]">
        Seni doğru anladık mı?
      </h1>
      <p className="mt-1.5 text-sm text-[#676e78]">
        Mentor eşleşmesini bu özete göre yapacağız. İstersen geri dönüp
        düzenleyebilirsin.
      </p>

      {startupLine ? (
        <div className="mt-6 flex min-h-[54px] items-center justify-between gap-4 rounded-lg border border-[#e4e7ea] bg-[#fcfcfd] px-4 py-3">
          <p className="text-[13px] font-medium text-[#676e78]">
            {startupLine}
          </p>
          <p className="shrink-0 text-xs text-[#858c96]">
            Profilinden otomatik getirildi
          </p>
        </div>
      ) : null}

      <SummaryCard
        label="İhtiyacın"
        onEdit={onEditNeed}
        editLabel="İhtiyacını düzenle"
      >
        <p className="text-lg font-semibold text-[#22262b]">{needTitle}</p>
      </SummaryCard>

      <SummaryCard
        label="Temel problem"
        onEdit={onEditProblem}
        editLabel="Temel problemi düzenle"
      >
        <p className="text-sm leading-6 text-[#22262b]">{problem}</p>
      </SummaryCard>

      <SummaryCard
        label="Görüşmeden beklediğin"
        onEdit={onEditOutcome}
        editLabel="Hedefi düzenle"
      >
        <p className="whitespace-pre-line text-sm leading-6 text-[#22262b]">
          {outcome}
        </p>
      </SummaryCard>

      {expertise.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#22262b]">
            Sana uygun mentor uzmanlıkları
          </p>
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
        Düzenle
      </button>
    </section>
  );
}
