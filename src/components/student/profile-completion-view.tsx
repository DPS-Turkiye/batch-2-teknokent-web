"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";
import Link from "next/link";

import { PageHeading, Panel } from "@/components/admin/admin-ui";
import {
  GoalField,
  SubtopicPicker,
  TopicPicker,
} from "@/components/student/interest-pickers";
import { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";
import { ProfileCompletionStep } from "@/interfaces/student-profile-completion";

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-4 py-2 text-sm disabled:opacity-50";
export function StudentProfileCompletionView() {
  const t = useTranslations("studentProfileCompletion");
  const form = useStudentProfileCompletion();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      {form.isLoading ? (
        <p role="status">{t("loading")}</p>
      ) : form.loadError ? (
        <div role="alert">
          <p>{t("loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            disabled={form.isFetching}
            onClick={form.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : form.finished ? (
        <Panel>
          <div className="space-y-4 p-6">
            <p role="status">
              {form.draft?.skipped ? t("skipped") : t("saved")}
            </p>
            <Link className={buttonClass} href="/student">
              {t("home")}
            </Link>
          </div>
        </Panel>
      ) : form.draft ? (
        <Panel>
          <form
            className="space-y-6 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (form.step === ProfileCompletionStep.Goal) form.finish();
              else form.next();
            }}
          >
            <fieldset disabled={form.isSaving} className="min-w-0 space-y-5">
              <legend className="mb-4 text-lg font-semibold">
                {t("step", { number: form.step + 1 })}:{" "}
                {t(`steps.${form.step}`)}
              </legend>
              {form.step === ProfileCompletionStep.Topics ? (
                <TopicPicker
                  categories={form.categories}
                  selected={form.draft.topics}
                  onToggle={form.toggleTopic}
                />
              ) : form.step === ProfileCompletionStep.Subtopics ? (
                <SubtopicPicker
                  groups={form.subtopicGroups}
                  selected={form.draft.subtopics}
                  onToggle={form.toggleSubtopic}
                />
              ) : (
                <GoalField value={form.draft.goal} onChange={form.setGoal} />
              )}
              {form.saveError ? <p role="alert">{t("saveError")}</p> : null}
              <div className="flex flex-wrap gap-3">
                {form.step > ProfileCompletionStep.Topics ? (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={form.back}
                  >
                    {t("back")}
                  </button>
                ) : null}
                <button type="submit" className={buttonClass}>
                  {form.isSaving
                    ? t("saving")
                    : form.step === ProfileCompletionStep.Goal
                      ? t("finish")
                      : t("next")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={form.skip}
                >
                  {t("skip")}
                </button>
              </div>
            </fieldset>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
