"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { CompletionStepper } from "@/components/student/profile-completion/completion-stepper";
import { GoalStep } from "@/components/student/profile-completion/goal-step";
import { TopicsStep } from "@/components/student/profile-completion/topics-step";
import { WelcomeStep } from "@/components/student/profile-completion/welcome-step";
import { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";
import { ProfileCompletionStep } from "@/interfaces/student-profile-completion";

const GHOST_BUTTON =
  "inline-flex h-11 items-center justify-center rounded-[14px] border border-[#dce1e6] bg-white px-5 text-sm font-semibold leading-5 tracking-[-0.014px] text-[#1c2026] hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY_BUTTON =
  "inline-flex h-11 items-center justify-center rounded-[14px] bg-[#d0112b] px-5 text-sm font-semibold leading-5 tracking-[-0.014px] text-white shadow-[0_1px_2px_rgb(28_32_38/0.04),0_1px_3px_rgb(28_32_38/0.05)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

/** The ODTÜ student's first-run wizard (Figma "Profil Tamamlama — 1/2/3"); every step can be skipped. */
export function StudentProfileCompletionView() {
  const t = useTranslations("studentProfileCompletion");
  const form = useStudentProfileCompletion();

  if (form.isLoading) {
    return <Notice role="status">{t("loading")}</Notice>;
  }
  if (form.loadError) {
    return (
      <Notice role="alert">
        <p>{t("loadError")}</p>
        <button
          type="button"
          className={GHOST_BUTTON}
          disabled={form.isFetching}
          onClick={form.retry}
        >
          {t("retry")}
        </button>
      </Notice>
    );
  }
  if (form.finished) {
    return (
      <Notice role="status">
        <p>{form.draft?.skipped ? t("skipped") : t("saved")}</p>
        <Link className={PRIMARY_BUTTON} href="/student">
          {t("home")}
        </Link>
      </Notice>
    );
  }
  const draft = form.draft;
  if (!draft) return null;

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        form.advance();
      }}
    >
      <div className="flex flex-col gap-8 pb-8 lg:flex-row lg:items-start">
        <CompletionStepper steps={form.steps} current={form.step} />
        <fieldset
          disabled={form.isSaving}
          className="flex min-w-0 flex-1 flex-col gap-6"
        >
          <legend className="sr-only">
            {t(`stepNames.${form.step}.title`)}
          </legend>
          {form.step === ProfileCompletionStep.Welcome ? (
            <WelcomeStep welcome={form.welcome} photo={form.photo} />
          ) : form.step === ProfileCompletionStep.Topics ? (
            <TopicsStep
              categories={form.categories}
              groups={form.subtopicGroups}
              topics={draft.topics}
              subtopics={draft.subtopics}
              onToggleTopic={form.toggleTopic}
              onToggleSubtopic={form.toggleSubtopic}
            />
          ) : (
            <GoalStep
              goal={draft.goal}
              summary={form.summary}
              onGoalChange={form.setGoal}
            />
          )}
          {form.saveError ? (
            <p
              role="alert"
              className="rounded-[12px] border border-[#e8b3ba] bg-[#fbf0f1] px-4 py-3 text-sm text-[#6e0816]"
            >
              {t("saveError")}
            </p>
          ) : null}
        </fieldset>
      </div>
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e9ed] bg-white px-4 py-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        {form.step === ProfileCompletionStep.Welcome ? (
          <SkipButton form={form} />
        ) : (
          <button
            type="button"
            className={GHOST_BUTTON}
            disabled={form.isSaving}
            onClick={form.back}
          >
            {t("back")}
          </button>
        )}
        <div className="flex flex-wrap gap-3">
          {form.step === ProfileCompletionStep.Welcome ? null : (
            <SkipButton form={form} />
          )}
          <button
            type="submit"
            className={PRIMARY_BUTTON}
            disabled={form.isSaving}
          >
            {form.isSaving
              ? t("saving")
              : form.isLastStep
                ? t("finish")
                : t("next")}
          </button>
        </div>
      </div>
    </form>
  );
}

function SkipButton({
  form,
}: {
  form: ReturnType<typeof useStudentProfileCompletion>;
}) {
  const t = useTranslations("studentProfileCompletion");
  return (
    <button
      type="button"
      className={GHOST_BUTTON}
      disabled={form.isSaving}
      onClick={form.skip}
    >
      {t("skip")}
    </button>
  );
}

function Notice({
  role,
  children,
}: {
  role: "status" | "alert";
  children: ReactNode;
}) {
  return (
    <div
      role={role}
      className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-[20px] border border-[#e5e9ed] bg-white p-6 text-sm text-[#1c2026]"
    >
      {children}
    </div>
  );
}
