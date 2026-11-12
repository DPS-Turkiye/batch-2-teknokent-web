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
  const t = useTranslations("iaProfile.goalStep");
  const tCatalogue = useTranslations("studentProfileCompletion");
  const topicLabel = useTranslations("peerTopics");
  const chips = [
    ...summary.topics.map((id) => ({ key: id, label: topicLabel(id) })),
    ...summary.subtopics.map((sub) => ({
      key: sub.id,
      label: tCatalogue(`subtopics.${sub.labelKey}`),
    })),
  ];
  return (
    <>
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-col gap-2">
        <label
          htmlFor="completion-goal"
          className="type-label text-text-primary"
        >
          {t("label")}
        </label>
        <textarea
          id="completion-goal"
          aria-describedby="completion-goal-help"
          className="min-h-[120px] w-full rounded-input border border-border-control bg-background-elevated px-4 py-3 type-body text-text-primary placeholder:text-text-placeholder focus:border-border-selected focus:outline-none focus:ring-[3px] focus:ring-background-selected"
          maxLength={STUDENT_GOAL_MAX}
          placeholder={t("placeholder")}
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
        />
        <p
          id="completion-goal-help"
          className="flex items-center gap-1 type-caption"
        >
          <Image src="/ia/profile/info-alt.svg" alt="" width={16} height={16} />
          <span className="text-text-secondary">
            {t("limit", { max: STUDENT_GOAL_MAX })}
          </span>
          <span className="text-text-muted">
            {t("count", { count: goal.length, max: STUDENT_GOAL_MAX })}
          </span>
        </p>
      </div>
      <section
        aria-labelledby="completion-summary"
        className="flex flex-col gap-2.5 rounded-[20px] border border-card-featured-border bg-background-surface p-5"
      >
        <h2 id="completion-summary" className="type-label text-text-primary">
          {t("summaryTitle")}
        </h2>
        {chips.length === 0 ? (
          <p className="type-body text-text-secondary">{t("summaryEmpty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="flex h-8 items-center rounded-full bg-brand-mentee-bg px-3 type-label-sm text-brand-mentee-strong"
              >
                {chip.label}
              </li>
            ))}
          </ul>
        )}
        <p className="type-caption text-text-secondary">{t("summaryNote")}</p>
      </section>
    </>
  );
}
