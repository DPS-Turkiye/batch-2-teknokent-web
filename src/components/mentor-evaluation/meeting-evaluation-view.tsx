"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { useMentorMeetingEvaluation } from "@/hooks/use-mentor-meeting-evaluation";
import {
  MENTOR_EVALUATION_NOTE_MAX_LENGTH,
  MENTOR_EVALUATION_QUALITIES,
  MENTOR_EVALUATION_QUALITY_IDS,
  MENTOR_EVALUATION_QUESTION_COUNT,
  OUTCOME_CLARITY_OPTIONS,
} from "@/lib/const/mentor-evaluation";

const RATING_VALUES = [1, 2, 3, 4, 5];
const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full px-[18px] py-2.5 text-[12.5px] font-medium leading-[19px]";
const secondaryButtonClass = `${primaryButtonClass} border border-[#d4d8dd] bg-white text-[#4a5059] hover:border-[#26a4ff]`;
const questionClass = "text-sm font-medium leading-5 text-[#22262b]";

function StartupAvatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#e6f1f8] text-[9px] font-semibold text-[#26a4ff]"
    >
      {initials}
    </span>
  );
}

function Breadcrumb({ startupName }: { startupName: string }) {
  const t = useTranslations("mentorEvaluation");
  const chevron = (
    <Image
      src="/mentor-evaluation/chevron-right.svg"
      alt=""
      width={14}
      height={14}
      className="size-3.5"
    />
  );
  return (
    <nav
      aria-label={t("breadcrumb")}
      className="flex items-center gap-1.5 text-[12.5px] text-[#4a5059]"
    >
      <Link href="/mentorships" className="text-[#676e78] hover:underline">
        {t("breadcrumbRoot")}
      </Link>
      {startupName ? (
        <>
          {chevron}
          <span>{startupName}</span>
        </>
      ) : null}
      {chevron}
      <span aria-current="page" className="font-medium">
        {t("breadcrumbPage")}
      </span>
    </nav>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <section
      className={`w-full rounded-[20px] border border-[#e4e7ea] bg-white px-8 ${className}`}
    >
      {children}
    </section>
  );
}

// TEST UI: placeholder until the design team's screen; replace when it arrives.
function HeldConfirmation({
  evaluation,
}: {
  evaluation: ReturnType<typeof useMentorMeetingEvaluation>;
}) {
  const t = useTranslations("mentorEvaluation");
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 py-5">
      <div className="min-w-0 flex-1">
        <p className={questionClass}>
          {evaluation.held ? t("heldDone") : t("heldQuestion")}
        </p>
        <p className="mt-1 text-xs text-[#858c96]">{t("heldHint")}</p>
        {evaluation.heldError ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {evaluation.heldError.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={evaluation.held ? evaluation.undoHeld : evaluation.confirmHeld}
        disabled={evaluation.isSavingHeld}
        className={
          evaluation.held
            ? secondaryButtonClass
            : `${primaryButtonClass} bg-[#26a4ff] text-white hover:bg-[#1592ec] disabled:bg-[#f3f4f6] disabled:text-[#aeb4bc]`
        }
      >
        {evaluation.isSavingHeld
          ? t("heldSaving")
          : evaluation.held
            ? t("heldUndo")
            : t("heldConfirm")}
      </button>
    </Card>
  );
}

export function MeetingEvaluationView({ meetingId }: { meetingId: string }) {
  const t = useTranslations("mentorEvaluation");
  const evaluation = useMentorMeetingEvaluation(meetingId);
  const { answers } = evaluation;

  if (evaluation.isLoading || !evaluation.meeting) {
    return (
      <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-3 sm:px-0">
        <p className="py-10 text-sm text-[#858c96]">
          {evaluation.isLoading ? t("loading") : t("notFound")}
        </p>
      </div>
    );
  }

  if (evaluation.isSent) {
    return (
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-7 px-4 pb-16 pt-3 sm:px-0">
        <Breadcrumb startupName={evaluation.startupName} />
        <HeldConfirmation evaluation={evaluation} />
        <Card className="flex flex-col items-center gap-4 pb-10 pt-12 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[#e6f1f8]">
            <Image
              src="/mentor-evaluation/done-blue.svg"
              alt=""
              width={30}
              height={30}
            />
          </span>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-[22px] font-semibold text-[#22262b]">
              {t("sentTitle")}
            </h1>
            <p className="max-w-[420px] text-[13.5px] leading-5 text-[#676e78]">
              {t("sentBody")}
            </p>
          </div>
          <p className="flex items-center gap-2 rounded-full bg-[#f3f4f6] py-1.5 pl-2 pr-3 text-xs text-[#676e78]">
            <StartupAvatar initials={evaluation.startupInitials} />
            {evaluation.meta}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <Link
              href="/mentorships"
              className={`${primaryButtonClass} bg-[#26a4ff] text-white hover:bg-[#1592ec]`}
            >
              {t("backToMentorships")}
            </Link>
            <Link href="/mentor-dashboard" className={secondaryButtonClass}>
              {t("home")}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const complete = evaluation.answered === MENTOR_EVALUATION_QUESTION_COUNT;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-7 px-4 pb-16 pt-3 sm:px-0">
      <Breadcrumb startupName={evaluation.startupName} />
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[28px] font-semibold text-[#22262b]">
          {t("title")}
        </h1>
        <p className="flex items-center gap-2.5 text-[13px] text-[#858c96]">
          <StartupAvatar initials={evaluation.startupInitials} />
          {evaluation.meta}
        </p>
      </header>

      <HeldConfirmation evaluation={evaluation} />

      <Card className="flex flex-col gap-7 py-7">
        <p className="flex items-center gap-2.5 rounded-xl border border-[#f5faff] bg-[#f2f8fc] px-4 py-3 text-[12.5px] leading-[18px] text-[#4a5059]">
          <Image
            src="/mentor-evaluation/clock.svg"
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {t("info")}
        </p>

        <fieldset className="flex flex-col items-center gap-3">
          <legend className={`${questionClass} mb-3 text-center`}>
            {t("preparedness")}
          </legend>
          <div className="flex gap-2.5">
            {RATING_VALUES.map((value) => {
              const selected = answers.preparedness === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={t("rating", { value })}
                  onClick={() => evaluation.setPreparedness(value)}
                  className={`grid size-9 place-items-center rounded-full border-[1.5px] text-sm font-semibold transition ${selected ? "border-[#26a4ff] bg-[#26a4ff] text-white" : "border-[#e4e7ea] bg-white text-[#676e78] hover:border-[#26a4ff]"}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <div className="flex w-full max-w-[340px] justify-between text-[11px] text-[#858c96]">
            <span>{t("preparednessLow")}</span>
            <span>{t("preparednessHigh")}</span>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 flex w-full items-end gap-3">
            <span className={`${questionClass} flex-1`}>{t("qualities")}</span>
            <span className="shrink-0 text-xs text-[#858c96]">
              {t("qualitiesHint")}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {MENTOR_EVALUATION_QUALITIES.map((quality, index) => {
              const qualityId = MENTOR_EVALUATION_QUALITY_IDS[index];
              if (!qualityId) return null;
              const selected = answers.qualities.includes(quality);
              return (
                <button
                  key={quality}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => evaluation.toggleQuality(quality)}
                  className={`rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition ${selected ? "border-[#26a4ff] bg-[#26a4ff] text-white" : "border-[#d4d8dd] bg-white text-[#4a5059] hover:border-[#26a4ff]"}`}
                >
                  {t(`quality.${qualityId}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={`${questionClass} mb-3`}>{t("clarity")}</legend>
          <div className="flex gap-1 rounded-full border border-[#e4e7ea] bg-[#f3f4f6] p-1">
            {OUTCOME_CLARITY_OPTIONS.map((option) => {
              const selected = answers.clarity === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => evaluation.setClarity(option)}
                  className={`flex-1 rounded-full py-[9px] text-[13px] font-medium transition ${selected ? "bg-[#26a4ff] text-white" : "text-[#4a5059] hover:bg-white"}`}
                >
                  {t(`clarityOption.${option}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className={questionClass}>
            {t("note")}{" "}
            <span className="font-normal text-[#858c96]">{t("optional")}</span>
          </span>
          <textarea
            value={answers.note}
            onChange={(event) => evaluation.setNote(event.target.value)}
            maxLength={MENTOR_EVALUATION_NOTE_MAX_LENGTH}
            placeholder={t("notePlaceholder")}
            className="h-[84px] w-full resize-none rounded-xl border border-[#e4e7ea] bg-white px-3.5 py-3 text-[13px] leading-[19px] text-[#22262b] outline-none placeholder:text-[#aeb4bc] focus:border-[#26a4ff]"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={evaluation.submit}
              disabled={!evaluation.canSubmit}
              className={`${primaryButtonClass} bg-[#26a4ff] text-white hover:bg-[#1592ec] disabled:bg-[#f3f4f6] disabled:text-[#aeb4bc]`}
            >
              {evaluation.isSubmitting ? t("submitting") : t("submit")}
            </button>
            <Link href="/mentor-dashboard" className={secondaryButtonClass}>
              {t("later")}
            </Link>
          </div>
          <p
            className={`flex items-center gap-1.5 text-xs font-medium ${complete ? "text-[#0f7a4d]" : "text-[#858c96]"}`}
          >
            {complete ? (
              <Image
                src="/mentor-evaluation/done-green.svg"
                alt=""
                width={14}
                height={14}
              />
            ) : null}
            {t("answered", {
              answered: evaluation.answered,
              total: MENTOR_EVALUATION_QUESTION_COUNT,
            })}
          </p>
        </div>
        {evaluation.error ? (
          <p role="alert" className="text-sm text-red-700">
            {evaluation.error.message}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
