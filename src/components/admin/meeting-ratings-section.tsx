"use client";

import { QueryNotice } from "@/components/admin/admin-ui";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import {
  formatRating,
  ratingQuestionRows,
  ratingResponseRate,
} from "@/lib/meeting-ratings";

const SCORES = [5, 4, 3, 2, 1] as const;

export function MeetingRatingsSection({
  ratings,
  isLoading,
  error,
}: {
  ratings: ProgramMeetingRatings | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  const rate = ratings ? ratingResponseRate(ratings) : null;
  const answers =
    ratings?.distribution.reduce((sum, count) => sum + count, 0) ?? 0;
  return (
    <section
      aria-label="Görüşme değerlendirmeleri"
      className="rounded-[28px] border border-[#e9ecef] bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            Görüşme değerlendirmeleri
          </h2>
          <p className="mt-1 text-[12.5px] text-[#858c96]">
            Takımların görüşme sonrası anketinden; yalnızca puanlar (1–5).
          </p>
        </div>
        {ratings && ratings.average != null ? (
          <div className="text-right">
            <p className="text-[28px] leading-none font-semibold text-[#22262b]">
              {formatRating(ratings.average)}
              <span className="text-[15px] font-medium text-[#858c96]">/5</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#858c96]">
              {ratings.ratedMeetingCount}/{ratings.heldMeetingCount} görüşme
              {rate != null ? ` · %${rate} yanıt` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {!ratings ? (
        <div className="mt-4">
          <QueryNotice isLoading={isLoading} error={error} />
        </div>
      ) : ratings.average == null ? (
        <p className="mt-4 rounded-2xl border border-[#f0f2f4] px-4 py-3 text-[13px] text-[#858c96]">
          {ratings.heldMeetingCount === 0
            ? "Bu pencerede gerçekleşen görüşme yok."
            : `${ratings.heldMeetingCount} görüşme gerçekleşti; henüz değerlendirme yok.`}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
          <ul className="space-y-2">
            {ratingQuestionRows(ratings).map((row) => (
              <li
                key={row.label}
                title={row.prompt}
                className="flex items-center gap-3 rounded-2xl border border-[#f0f2f4] px-4 py-3"
              >
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#22262b]">
                  {row.label}
                </span>
                <span
                  aria-hidden
                  className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-[#f0f2f4] sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-[#22262b]"
                    style={{ width: `${((row.average ?? 0) / 5) * 100}%` }}
                  />
                </span>
                <span className="w-9 text-right text-[13px] font-medium text-[#676e78]">
                  {formatRating(row.average)}
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-[#f0f2f4] px-4 py-3">
            <p className="text-[12.5px] text-[#676e78]">Puan dağılımı</p>
            <ul className="mt-2 space-y-1.5">
              {SCORES.map((score) => {
                const count = ratings.distribution[score - 1] ?? 0;
                return (
                  <li
                    key={score}
                    className="flex items-center gap-2 text-[12.5px] text-[#676e78]"
                  >
                    <span className="w-3 text-[#22262b]">{score}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0f2f4]">
                      <span
                        className="block h-full rounded-full bg-[#ff6a3d]"
                        style={{
                          width: answers ? `${(count / answers) * 100}%` : "0%",
                        }}
                      />
                    </span>
                    <span className="w-6 text-right">{count}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[12px] text-[#858c96]">
              {ratings.feedbackCount} anket · {answers} yanıt
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
