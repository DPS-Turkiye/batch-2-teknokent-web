"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { STUDENT_GOAL_MAX } from "@/components/student/interest-pickers";
import { StepHeading } from "@/components/student/profile-completion/welcome-step";
import type { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";

type Summary = ReturnType<typeof useStudentProfileCompletion>["summary"];

/** Step 3 (Figma "Profil Tamamlama — 3 · Hedef"): the optional goal and a summary of the choices. */
export function GoalStep({
  goal,
  summary,
  onGoalChange,
}: {
  goal: string;
  summary: Summary;
  onGoalChange: (value: string) => void;
}) {
  const t = useTranslations("studentProfileCompletion");
  const topicLabel = useTranslations("peerTopics");
  const chips = [
    ...summary.topics.map((id) => ({ key: id, label: topicLabel(id) })),
    ...summary.subtopics.map((sub) => ({
      key: sub.id,
      label: t(`subtopics.${sub.labelKey}`),
    })),
  ];
  return (
    <>
      <StepHeading
        title={t("goalStep.title")}
        subtitle={t("goalStep.subtitle")}
      />
      <div className="flex flex-col gap-2">
        <label
          htmlFor="completion-goal"
          className="text-sm font-medium leading-5 tracking-[-0.014px] text-[#1c2026]"
        >
          {t("goalStep.label")}
        </label>
        <textarea
          id="completion-goal"
          aria-describedby="completion-goal-help"
          className="min-h-[120px] w-full rounded-[12px] border border-[#868f99] bg-white px-4 py-3 text-sm leading-[22px] text-[#1c2026] placeholder:text-[#6e7681] focus:border-[#1c2026] focus:outline-none focus:ring-[3px] focus:ring-[#fdedef]"
          maxLength={STUDENT_GOAL_MAX}
          placeholder={t("goalStep.placeholder")}
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
        />
        <p
          id="completion-goal-help"
          className="flex items-center gap-1 text-xs leading-4"
        >
          <Image src="/ia/profile/info-alt.svg" alt="" width={16} height={16} />
          <span className="text-[#575f69]">
            {t("goalStep.limit", { max: STUDENT_GOAL_MAX })}
          </span>
          <span className="text-[#6e7681]">
            {t("goalStep.count", {
              count: goal.length,
              max: STUDENT_GOAL_MAX,
            })}
          </span>
        </p>
      </div>
      <section
        aria-labelledby="completion-summary"
        className="flex flex-col gap-2.5 rounded-[20px] border border-[#f9c9cf] p-5"
      >
        <h2
          id="completion-summary"
          className="text-sm font-medium leading-5 tracking-[-0.014px] text-[#1c2026]"
        >
          {t("goalStep.summaryTitle")}
        </h2>
        {chips.length === 0 ? (
          <p className="text-sm text-[#575f69]">{t("goalStep.summaryEmpty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="flex h-8 items-center rounded-full bg-[#fdedef] px-3 text-xs font-medium leading-4 text-[#d0112b]"
              >
                {chip.label}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs leading-4 text-[#575f69]">
          {t("goalStep.summaryNote")}
        </p>
      </section>
    </>
  );
}
