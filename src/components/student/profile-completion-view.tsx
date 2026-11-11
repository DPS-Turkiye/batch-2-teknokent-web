"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button, ButtonVariant } from "@/components/ia/button";
import { CompletionStepper } from "@/components/student/profile-completion/completion-stepper";
import { GoalStep } from "@/components/student/profile-completion/goal-step";
import { TopicsStep } from "@/components/student/profile-completion/topics-step";
import { WelcomeStep } from "@/components/student/profile-completion/welcome-step";
import { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";
import { ProfileCompletionStep } from "@/interfaces/student-profile-completion";
import { IaAccent } from "@/types/ia-theme";

/** The ODTÜ student's first-run wizard (Figma "Profil Tamamlama — 1/2/3"); every step can be skipped. */
export function StudentProfileCompletionView() {
  return (
    <div data-ia-accent={IaAccent.Odtu}>
      <CompletionWizard />
    </div>
  );
}

function CompletionWizard() {
  const t = useTranslations("iaProfile");
  const form = useStudentProfileCompletion();

  if (form.isLoading) {
    return <Notice role="status">{t("loading")}</Notice>;
  }
  if (form.loadError) {
    return (
      <Notice role="alert">
        <p>{t("loadError")}</p>
        <Button
          variant={ButtonVariant.Ghost}
          disabled={form.isFetching}
          onClick={form.retry}
        >
          {t("retry")}
        </Button>
      </Notice>
    );
  }
  if (form.finished) {
    return (
      <Notice role="status">
        <p>{form.draft?.skipped ? t("skipped") : t("saved")}</p>
        <Button href="/student">{t("home")}</Button>
      </Notice>
    );
  }
  const draft = form.draft;
  if (!draft) return null;

  const skip = (
    <Button
      variant={ButtonVariant.Ghost}
      disabled={form.isSaving}
      onClick={form.skip}
    >
      {t("skip")}
    </Button>
  );

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
              className="rounded-[12px] border border-status-error-border bg-status-error-bg px-4 py-3 type-body text-status-error-text"
            >
              {t("saveError")}
            </p>
          ) : null}
        </fieldset>
      </div>
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-background-surface px-4 py-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        {form.step === ProfileCompletionStep.Welcome ? (
          skip
        ) : (
          <Button
            variant={ButtonVariant.Ghost}
            disabled={form.isSaving}
            onClick={form.back}
          >
            {t("back")}
          </Button>
        )}
        <div className="flex flex-wrap gap-3">
          {form.step === ProfileCompletionStep.Welcome ? null : skip}
          <Button type="submit" disabled={form.isSaving}>
            {form.isSaving
              ? t("saving")
              : form.isLastStep
                ? t("finish")
                : t("next")}
          </Button>
        </div>
      </div>
    </form>
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
      className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-[20px] border border-border-subtle bg-background-surface p-6 type-body text-text-primary"
    >
      {children}
    </div>
  );
}
