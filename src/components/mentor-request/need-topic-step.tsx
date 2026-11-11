import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { NeedWizardStepper } from "@/components/mentor-request/need-wizard-stepper";
import type {
  MentorRequestNeedTopicId,
  NeedTopicChoice,
} from "@/lib/mentor-request-need";

export function NeedTopicStep({
  topics,
  topicId,
  otherSummary,
  onSelectTopic,
  onOtherSummaryChange,
}: {
  topics: readonly NeedTopicChoice[];
  topicId: MentorRequestNeedTopicId;
  otherSummary: string;
  onSelectTopic: (id: MentorRequestNeedTopicId) => void;
  onOtherSummaryChange: (value: string) => void;
}) {
  const t = useTranslations("mentorRequest");
  return (
    <div>
      <NeedWizardStepper current={0} />

      <h1 className="mt-8 text-[30px] font-medium leading-tight text-[#676e78]">
        {t("topicStep.heading")}
      </h1>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {topics.map((topic) => {
          const selected = topic.id === topicId;
          return (
            <button
              key={topic.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectTopic(topic.id)}
              className={`flex min-h-[103px] items-start gap-3 rounded-[10px] px-5 py-4 text-left transition ${
                selected
                  ? "border-[1.5px] border-[#e86f22] bg-[#fdede0]"
                  : "border border-[#e4e7ea] bg-white hover:border-[#f2b78f]"
              }`}
            >
              <span className="min-w-0 flex-1">
                <strong className="block text-[15px] font-semibold text-[#22262b]">
                  {t(`topics.${topic.id}.title`)}
                </strong>
                <span className="mt-1 block text-[13px] leading-5 text-[#676e78]">
                  {t(`topics.${topic.id}.description`)}
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

      {topicId === "other" ? (
        <label className="mt-3 block rounded-[10px] border border-[#e4e7ea] bg-white p-4">
          <span className="text-xs font-semibold uppercase text-[#777]">
            {t("describeBriefly")}
          </span>
          <textarea
            value={otherSummary}
            onChange={(event) => onOtherSummaryChange(event.target.value)}
            placeholder={t("topicStep.placeholder")}
            className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#ccc]"
          />
        </label>
      ) : null}
    </div>
  );
}
