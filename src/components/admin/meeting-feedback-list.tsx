// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { useProgramMeetingFeedback } from "@/hooks/use-program-report";
import { feedbackQualities, feedbackRatingRows } from "@/lib/meeting-ratings";
import { formatDateTime } from "@/lib/utils";

/** Who rated whom under the program's rating averages, for the same window. */
export function MeetingFeedbackList({
  programId,
  from,
}: {
  programId: string;
  from: string | null;
}) {
  const t = useTranslations("meetingRatings");
  const tBenefits = useTranslations("meetingPages.feedback.benefits");
  const tMentor = useTranslations("mentorEvaluation");
  const locale = useLocale();
  const {
    feedback,
    total,
    page,
    totalPages,
    isLoading,
    error,
    hasPrevious,
    hasNext,
    previous,
    next,
  } = useProgramMeetingFeedback(programId, from);

  return (
    <div className="mt-5 border-t border-[#f0f2f4] pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-[#22262b]">
            {t("details.title")}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-[#858c96]">
            {t("details.hint")}
          </p>
        </div>
        {total > 0 ? (
          <p className="text-[12px] text-[#858c96]">
            {t("details.count", { count: total })}
          </p>
        ) : null}
      </div>

      {isLoading || error ? (
        <div className="mt-3">
          <QueryNotice isLoading={isLoading} error={error} />
        </div>
      ) : feedback.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-[#f0f2f4] px-4 py-3 text-[13px] text-[#858c96]">
          {t("details.empty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2" aria-label={t("details.title")}>
          {feedback.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[#f0f2f4] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-[#22262b]">
                    {[formatDateTime(item.meetingAt, locale), item.meetingTitle]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[#676e78]">
                    {`${item.organizationName} · ${
                      item.mentorName
                        ? t("details.mentor", { name: item.mentorName })
                        : t("details.noMentor")
                    }`}
                  </p>
                </div>
                <p className="text-[12.5px] text-[#22262b]">
                  {t("details.author", { name: item.authorName })}
                  <span className="ml-2 rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11.5px] text-[#676e78]">
                    {t(`details.sides.${item.side}`)}
                  </span>
                </p>
              </div>

              <ul className="mt-2 flex flex-wrap gap-1.5">
                {feedbackRatingRows(item).map((row) => (
                  <li
                    key={row.labelKey}
                    className="rounded-full border border-[#e9ecef] px-2.5 py-1 text-[12px] text-[#676e78]"
                  >
                    {t(row.labelKey)}{" "}
                    <span className="font-medium text-[#22262b]">
                      {row.clarity
                        ? tMentor(`clarityOption.${row.clarity}`)
                        : t("details.rating", { rating: row.rating })}
                    </span>
                  </li>
                ))}
              </ul>

              {item.qualities.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {feedbackQualities(item).map((quality) => (
                    <li
                      key={quality.text}
                      className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[12px] text-[#c2491f]"
                    >
                      {"menteeId" in quality
                        ? tBenefits(quality.menteeId)
                        : "mentorId" in quality
                          ? tMentor(`quality.${quality.mentorId}`)
                          : quality.text}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.note ? (
                <p className="mt-2 text-[13px] whitespace-pre-line text-[#22262b]">
                  <span className="text-[#858c96]">{t("details.note")}: </span>
                  {item.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label={t("details.pager")}
          className="mt-3 flex items-center justify-end gap-2 text-[12.5px]"
        >
          <button
            type="button"
            onClick={previous}
            disabled={!hasPrevious}
            className="rounded-full border border-[#e9ecef] px-3 py-1 text-[#22262b] disabled:opacity-40"
          >
            {t("details.previous")}
          </button>
          <span aria-live="polite" className="text-[#858c96]">
            {t("details.page", { page: page + 1, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={!hasNext}
            className="rounded-full border border-[#e9ecef] px-3 py-1 text-[#22262b] disabled:opacity-40"
          >
            {t("details.next")}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
