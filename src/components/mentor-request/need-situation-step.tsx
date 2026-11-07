import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { NeedWizardStepper } from "@/components/mentor-request/need-wizard-stepper";
import type {
  MentorRequestNeedSituationId,
  NeedSituationChoice,
} from "@/lib/mentor-request-need";

export function NeedSituationStep({
  situations,
  situationId,
  noneSummary,
  onSelectSituation,
  onNoneSummaryChange,
  onSelectStep,
}: {
  situations: readonly NeedSituationChoice[];
  situationId: MentorRequestNeedSituationId;
  noneSummary: string;
  onSelectSituation: (id: MentorRequestNeedSituationId) => void;
  onNoneSummaryChange: (value: string) => void;
  onSelectStep?: (index: number) => void;
}) {
  const t = useTranslations("mentorRequest");
  return (
    <div>
      <NeedWizardStepper current={1} onSelectStep={onSelectStep} />

      <h1 className="mt-8 text-[30px] font-semibold leading-tight text-[#676e78]">
        {t("situationStep.heading")}
      </h1>

      <div className="mt-5 grid gap-2.5">
        {situations.map((situation) => {
          const selected = situation.id === situationId;
          return (
            <button
              key={situation.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectSituation(situation.id)}
              className={`flex min-h-[72px] items-start gap-3 rounded-[10px] px-4 py-3.5 text-left transition ${
                selected
                  ? "border-[1.5px] border-[#e86f22] bg-[#fdede0]"
                  : "border border-[#e4e7ea] bg-white hover:border-[#f2b78f]"
              }`}
            >
              <span className="min-w-0 flex-1">
                <strong className="block text-[15px] font-medium text-[#22262b]">
                  {t(`situations.${situation.id}.title`)}
                </strong>
                <span className="mt-1 block text-xs leading-4 text-[#676e78]">
                  {t(`situations.${situation.id}.description`)}
                </span>
              </span>
              {selected ? (
                <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-[#e86f22]">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {situationId === "none" ? (
        <label className="mt-3 block rounded-[10px] border border-[#e4e7ea] bg-white p-4">
          <span className="text-xs font-semibold uppercase text-[#777]">
            {t("describeBriefly")}
          </span>
          <textarea
            value={noneSummary}
            onChange={(event) => onNoneSummaryChange(event.target.value)}
            placeholder={t("situationStep.placeholder")}
            className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#ccc]"
          />
        </label>
      ) : null}
    </div>
  );
}
