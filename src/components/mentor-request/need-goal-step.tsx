import { useTranslations } from "next-intl";

import { NeedWizardStepper } from "@/components/mentor-request/need-wizard-stepper";
import {
  MENTOR_REQUEST_NEED_GOALS,
  type MentorRequestNeedGoalId,
} from "@/lib/mentor-request-need";

export function NeedGoalStep({
  goalIds,
  goalNote,
  onToggleGoal,
  onGoalNoteChange,
  onSelectStep,
}: {
  goalIds: readonly string[];
  goalNote: string;
  onToggleGoal: (id: MentorRequestNeedGoalId) => void;
  onGoalNoteChange: (value: string) => void;
  onSelectStep?: ((index: number) => void) | undefined;
}) {
  const t = useTranslations("mentorRequest");
  return (
    <div>
      <NeedWizardStepper current={2} onSelectStep={onSelectStep} />

      <h1 className="mt-8 text-[30px] font-semibold leading-tight text-[#676e78]">
        {t("goalStep.heading")}
      </h1>
      <p className="mt-1.5 text-sm text-[#676e78]">{t("goalStep.hint")}</p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {MENTOR_REQUEST_NEED_GOALS.map((goal) => {
          const selected = goalIds.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggleGoal(goal.id)}
              className={`min-h-8 rounded-2xl border px-3.5 py-2 text-left text-xs font-medium transition ${
                selected
                  ? "border-[#e86f22] bg-[#fdede0] text-[#e86f22]"
                  : "border-[#e4e7ea] bg-[#fcfcfd] text-[#676e78] hover:border-[#f2b78f]"
              }`}
            >
              {t(`goals.${goal.id}`)}
            </button>
          );
        })}
      </div>

      <label className="mt-9 block">
        <span className="text-[15px] font-medium text-[#22262b]">
          {t("goalStep.noteLabel")}
        </span>
        <textarea
          value={goalNote}
          onChange={(event) => onGoalNoteChange(event.target.value)}
          placeholder={t("goalStep.notePlaceholder")}
          className="mt-3 min-h-[150px] w-full resize-none rounded-[10px] border border-[#e4e7ea] bg-white px-4 py-3.5 text-[13px] text-[#22262b] outline-none placeholder:text-[#858c96]"
        />
      </label>
    </div>
  );
}
