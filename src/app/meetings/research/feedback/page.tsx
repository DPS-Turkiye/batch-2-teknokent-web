"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Suspense } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import {
  useMeetingFeedback,
  useMeetingLifecycle,
} from "@/hooks/use-meeting-lifecycle";
import {
  MEETING_FEEDBACK_BENEFIT_IDS,
  MEETING_FEEDBACK_BENEFITS,
  MEETING_FEEDBACK_QUESTIONS,
} from "@/lib/const";
import { formatMeetingShort } from "@/lib/format";
import { mentorFirstName } from "@/lib/mentor-profile-request";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function MeetingFeedbackContent() {
  const t = useTranslations("meetingPages.feedback");
  const locale = useLocale();
  const { error, isLoading, meeting } = useMeetingLifecycle();
  const {
    canSubmit,
    isFeedbackLoading,
    nextMeetingNote,
    rate,
    ratings,
    readOnly,
    selectedBenefits,
    setNextMeetingNote,
    submit,
    submitError,
    submitted,
    submitting,
    toggleBenefit,
  } = useMeetingFeedback(meeting?.id ?? null);

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Mentorships}
        title={t("title")}
        backHref="/mentorships?tab=history"
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  const mentorName = meeting.mentorName ?? t("mentorFallback");
  const mentorFirst = mentorFirstName(mentorName);
  const pageTitle = readOnly ? t("readOnlyTitle") : t("title");

  if (isFeedbackLoading) {
    return (
      <AppShell
        active={AppArea.Mentorships}
        title={pageTitle}
        backHref="/mentorships?tab=history"
      >
        <div className="grid min-h-[40vh] place-items-center text-sm text-[#676e78]">
          {t("loading")}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active={AppArea.Mentorships}
      title={pageTitle}
      backHref="/mentorships?tab=history"
    >
      <div className="mx-auto w-full max-w-[830px] px-4 pb-14 pt-6 sm:px-8">
        {submitted ? (
          <section className="rounded-xl border border-[#e4e7ea] bg-white px-6 py-20 text-center">
            <CheckCircle2 className="mx-auto size-14 text-[#23824b]" />
            <h1 className="mt-5 text-2xl font-semibold text-[#22262b]">
              {t("sentTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#676e78]">
              {t("sentBody")}
            </p>
            <Link
              href="/mentorships?tab=history"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19]"
            >
              {t("back")}
            </Link>
          </section>
        ) : (
          <>
            <p className="text-[13px] text-[#858c96]">
              <Link href="/mentorships" className="hover:text-[#515861]">
                {t("breadcrumb")}
              </Link>
              <span className="mx-1.5">›</span>
              <span className="font-medium text-[#22262b]">{mentorName}</span>
            </p>

            <section className="mt-5 flex items-start gap-[22px] rounded-xl px-1 py-2 sm:px-5 sm:py-[18px]">
              <div className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-[#fdebdd] text-[26px] font-medium text-[#e86f22]">
                {initials(mentorName)}
              </div>
              <div className="min-w-0">
                <h1 className="text-[28px] font-medium leading-tight text-[#22262b]">
                  {readOnly ? t("readOnlyHeading") : t("heading")}
                </h1>
                <p className="mt-1.5 text-[15px] leading-snug text-[#676e78]">
                  {readOnly
                    ? t("readOnlyIntro", { name: mentorFirst })
                    : t("intro", { name: mentorFirst })}
                </p>
                <p className="mt-2 text-[13px] text-[#858c96]">
                  {mentorName}
                  {meeting.agenda ? ` · ${meeting.agenda}` : ""}
                  {` · ${formatMeetingShort(meeting.scheduledAt, locale)}`}
                </p>
              </div>
            </section>

            <section className="mt-5 rounded-xl border border-[#e4e7ea] bg-white px-5 py-7 sm:px-8">
              <p className="rounded-lg bg-[#fdebdd] px-4 py-3 text-xs leading-5 text-[#80591a]">
                {readOnly ? t("locked") : t("purpose")}
              </p>

              <div className="mt-7 space-y-7">
                {MEETING_FEEDBACK_QUESTIONS.map((question, questionIndex) => (
                  <fieldset key={question.id} className="text-center">
                    <legend className="w-full text-sm font-medium text-[#1a1a1a]">
                      {questionIndex + 1}.{" "}
                      {t(`questions.${question.id}.prompt`)}
                    </legend>
                    <div className="mt-3 flex justify-center gap-2.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={readOnly}
                          aria-label={`${t(`questions.${question.id}.prompt`)}: ${value}`}
                          aria-pressed={ratings[questionIndex] === value}
                          onClick={() => rate(questionIndex, value)}
                          className={
                            "size-9 rounded-[18px] border-[1.5px] text-sm font-semibold transition " +
                            (ratings[questionIndex] === value
                              ? "border-[#e86f22] bg-[#e86f22] text-white"
                              : "border-[#e4e7ea] bg-white text-[#666b75] " +
                                (readOnly
                                  ? "cursor-default opacity-70"
                                  : "hover:border-[#f2b78f]"))
                          }
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="mx-auto mt-2 flex max-w-[320px] justify-between text-[11px] text-[#666b75]">
                      <span>{t(`questions.${question.id}.low`)}</span>
                      <span>{t(`questions.${question.id}.high`)}</span>
                    </div>
                  </fieldset>
                ))}
              </div>

              <h2 className="mt-8 text-sm font-medium text-[#1a1a1a]">
                {t("benefitsTitle")}
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-3">
                {MEETING_FEEDBACK_BENEFITS.map((benefit, index) => {
                  const benefitId = MEETING_FEEDBACK_BENEFIT_IDS[index];
                  if (!benefitId) return null;
                  const selected = selectedBenefits.has(benefit);
                  return (
                    <button
                      key={benefit}
                      type="button"
                      disabled={readOnly}
                      aria-pressed={selected}
                      onClick={() => toggleBenefit(benefit)}
                      className={
                        "rounded-[20px] border px-3.5 py-2 text-[12.5px] font-medium transition " +
                        (selected
                          ? "border-[#e86f22] bg-[#e86f22] text-white"
                          : "border-[#e4e7ea] bg-[#f7f7f7] text-[#1a1a1a] " +
                            (readOnly
                              ? "cursor-default opacity-70"
                              : "hover:border-[#f2b78f]"))
                      }
                    >
                      {t(`benefits.${benefitId}`)}
                    </button>
                  );
                })}
              </div>

              <label className="mt-7 block">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {t("noteLabel")}
                </span>
                <textarea
                  value={nextMeetingNote}
                  onChange={(event) => setNextMeetingNote(event.target.value)}
                  rows={3}
                  readOnly={readOnly}
                  placeholder={readOnly ? t("noNote") : t("notePlaceholder")}
                  className={
                    "mt-2 w-full resize-y rounded-lg border border-[#e4e7ea] px-3 py-2.5 text-sm text-[#22262b] outline-none placeholder:text-[#a4aab2] " +
                    (readOnly
                      ? "cursor-default bg-[#f7f7f7]"
                      : "focus:border-[#e86f22]")
                  }
                />
              </label>

              {submitError ? (
                <p
                  role="alert"
                  className="mt-6 rounded-lg bg-[#fdeaea] px-4 py-3 text-sm text-[#b42318]"
                >
                  {submitError}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                {readOnly ? (
                  <Link
                    href="/mentorships?tab=history"
                    className="inline-flex min-h-[41px] items-center justify-center rounded-lg bg-[#e86f22] px-[22px] text-[13px] font-medium text-white hover:bg-[#ce5e19]"
                  >
                    {t("back")}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!canSubmit}
                      className="inline-flex min-h-[41px] items-center justify-center rounded-lg bg-[#e86f22] px-[22px] text-[13px] font-medium text-white hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? t("sending") : t("send")}
                    </button>
                    <Link
                      href="/mentorships?tab=history"
                      className="inline-flex min-h-[41px] items-center justify-center rounded-lg border border-[#e4e7ea] bg-white px-[22px] text-[13px] font-medium text-[#515861]"
                    >
                      {t("later")}
                    </Link>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function MeetingFeedbackPage() {
  const t = useTranslations("meetingPages.feedback");
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-white text-sm text-[#676e78]">
          {t("loading")}
        </div>
      }
    >
      <MeetingFeedbackContent />
    </Suspense>
  );
}
