"use client";
// TEST UI: placeholder until the design team's screen; replace when it arrives.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeading, Panel } from "@/components/admin/admin-ui";
import { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";
import { ProfileCompletionStep } from "@/interfaces/student-profile-completion";

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-4 py-2 text-sm disabled:opacity-50";
export function StudentProfileCompletionView() {
  const t = useTranslations("studentProfileCompletion");
  const form = useStudentProfileCompletion();
  const topicLabel = useTranslations("peerTopics");
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeading title={t("title")} subtitle={t("fixtureNotice")} />
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.categories.map((item) => (
                    <label
                      className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                      key={item.id}
                    >
                      <input
                        type="checkbox"
                        checked={form.draft!.topics.includes(item.id)}
                        onChange={() => form.toggleTopic(item.id)}
                      />
                      <span>{topicLabel(item.id)}</span>
                    </label>
                  ))}
                </div>
              ) : form.step === ProfileCompletionStep.Subtopics ? (
                <>
                  {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                  <p className="text-sm text-[#676e78]">
                    {t("subtopicNotice")}
                  </p>
                  {form.subtopicGroups.length === 0 ? (
                    <p>{t("noTopics")}</p>
                  ) : (
                    form.subtopicGroups.map((item) => (
                      <fieldset key={item.id} className="space-y-2">
                        <legend className="mb-2 font-medium">
                          {topicLabel(item.id)}
                        </legend>
                        {item.subtopics.map((sub) => (
                          <label
                            key={sub.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={form.draft!.subtopics.includes(sub.id)}
                              onChange={() => form.toggleSubtopic(sub.id)}
                            />
                            {t(`subtopics.${sub.labelKey}`)}
                          </label>
                        ))}
                      </fieldset>
                    ))
                  )}
                </>
              ) : (
                <label className="block space-y-2 text-sm">
                  <span>{t("goal")}</span>
                  <textarea
                    className="min-h-32 w-full rounded-xl border p-3"
                    maxLength={1000}
                    value={form.draft.goal}
                    onChange={(event) => form.setGoal(event.target.value)}
                  />
                </label>
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
