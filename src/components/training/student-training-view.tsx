// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { TrainingVideo } from "@/components/training/training-video";
import { useStudentTraining } from "@/hooks/use-student-training";
import { AppointmentSide } from "@/interfaces/appointment";
import { TrainingState } from "@/interfaces/training";
import { PEER_MENTORING_SIDE_PARAM } from "@/lib/peer-mentoring";
import { errorMessage, formatDateTime } from "@/lib/utils";

const MENTORLUK_VER = `/student/peer-mentoring?${PEER_MENTORING_SIDE_PARAM}=${AppointmentSide.Mentor}`;

/**
 * Akran Mentoru eğitimi: watch the video, then the ten-question quiz. Passing awards the badge at once and the
 * page sends the student on to Mentorluk Ver to create their mentor profile.
 */
export function StudentTrainingView() {
  const t = useTranslations("studentTraining");
  const locale = useLocale();
  const flow = useStudentTraining();
  const training = flow.training;

  if (flow.isLoading) {
    return (
      <p role="status" className="text-sm text-[#676e78]">
        {t("loading")}
      </p>
    );
  }
  if (flow.loadError || !training) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {errorMessage(flow.loadError, t("loadFailed"))}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[#22262b]">{t("title")}</h1>
        {training.programName ? (
          <p className="text-sm text-[#676e78]">{training.programName}</p>
        ) : null}
      </header>

      {flow.result ? (
        <section
          role="status"
          className={`rounded-2xl px-5 py-4 ${flow.result.passed ? "bg-[#f0fdf4]" : "bg-[#fff6e5]"}`}
        >
          <p className="font-semibold">
            {flow.result.passed ? t("passed") : t("failed")}
          </p>
          <p className="text-sm">
            {t("score", {
              score: flow.result.score,
              total: training.questionCount,
            })}
          </p>
        </section>
      ) : null}

      {training.state === TrainingState.NotAvailable ? (
        <p className="text-sm text-[#676e78]">{t("notAvailable")}</p>
      ) : null}

      {training.state === TrainingState.Blocked ? (
        <p className="text-sm text-[#676e78]">{t("blocked")}</p>
      ) : null}

      {training.state === TrainingState.BadgeActive ? (
        <div className="space-y-3">
          <p className="text-sm text-[#22262b]">{t("badgeActive")}</p>
          <Link
            href={MENTORLUK_VER}
            className="inline-flex rounded-full bg-[#22262b] px-5 py-2.5 text-sm font-medium text-white"
          >
            {t("toMentorProfile")}
          </Link>
        </div>
      ) : null}

      {training.state === TrainingState.Video && training.videoId ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t("stepVideo")}</h2>
          <p className="text-sm text-[#676e78]">{t("videoIntro")}</p>
          <TrainingVideo
            videoId={training.videoId}
            title={t("videoTitle")}
            onWatched={flow.markWatched}
          />
        </section>
      ) : null}

      {training.state === TrainingState.Quiz && !flow.quiz ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t("stepQuiz")}</h2>
          <p className="text-sm text-[#676e78]">
            {t("quizIntro", {
              total: training.questionCount,
              pass: training.passMark,
            })}
          </p>
          {training.attemptsLeft > 0 ? (
            <>
              <p className="text-xs text-[#858c96]">
                {t("attemptsLeft", { count: training.attemptsLeft })}
              </p>
              <button
                type="button"
                onClick={flow.start}
                disabled={flow.quizLoading}
                className="rounded-full bg-[#22262b] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {flow.result && !flow.result.passed
                  ? t("tryAgain")
                  : t("startQuiz")}
              </button>
            </>
          ) : (
            <p className="text-sm text-[#b94f12]">
              {t("noAttemptsLeft", {
                date: training.nextAttemptAt
                  ? formatDateTime(training.nextAttemptAt, locale)
                  : "",
              })}
            </p>
          )}
          {flow.quizError ? (
            <p role="alert" className="text-sm text-red-700">
              {errorMessage(flow.quizError, t("loadFailed"))}
            </p>
          ) : null}
        </section>
      ) : null}

      {flow.quiz ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            flow.submit();
          }}
        >
          <ol className="space-y-4">
            {flow.quiz.questions.map((question, position) => (
              <li key={question.id}>
                <fieldset className="space-y-2 rounded-2xl border border-[#eceef0] p-4">
                  <legend className="px-1 text-sm font-medium text-[#22262b]">
                    {position + 1}. {question.text}
                  </legend>
                  {question.options.map((option) => (
                    <label
                      key={option.index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={flow.answers[question.id] === option.index}
                        onChange={() => flow.choose(question.id, option.index)}
                      />
                      {option.text}
                    </label>
                  ))}
                </fieldset>
              </li>
            ))}
          </ol>
          {flow.submitError ? (
            <p role="alert" className="text-sm text-red-700">
              {errorMessage(flow.submitError, t("submitFailed"))}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!flow.canSubmit}
              className="rounded-full bg-[#22262b] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {flow.isSubmitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
