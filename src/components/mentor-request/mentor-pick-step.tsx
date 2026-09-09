import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import type { MentorProfile } from "@/interfaces/mentor";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import {
  headingForPickFilter,
  MENTOR_PICK_FILTERS,
  type MentorPickFilterId,
} from "@/lib/mentor-request-pick";

export function MentorPickStep({
  filter,
  listedMentors,
  matchingError,
  isMatching,
  mentorId,
  onFilterChange,
}: {
  filter: MentorPickFilterId;
  listedMentors: readonly MentorProfile[];
  matchingError?: string;
  isMatching?: boolean;
  mentorId: string;
  onFilterChange: (filter: MentorPickFilterId) => void;
}) {
  return (
    <div>
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Mentor listesi"
      >
        {MENTOR_PICK_FILTERS.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onFilterChange(item.id)}
              className={`rounded-full border px-4 py-2 text-xs ${
                selected
                  ? "border-[#e86f22] bg-[#e86f22] text-white"
                  : "border-[#e5e7eb] bg-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#999]">
        {headingForPickFilter(filter)}
      </h2>
      {isMatching ? (
        <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Talep ve girişim profiliniz kullanılarak öneriler hazırlanıyor…
        </p>
      ) : null}
      {matchingError ? (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {matchingError} Tümü listesinden seçim yapabilirsiniz.
        </p>
      ) : null}
      {listedMentors.length === 0 && !isMatching ? (
        <p className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-6 text-sm text-[#777]">
          {filter === "recommended"
            ? "Bu ihtiyaca göre önerilen mentor bulunamadı. Tümü listesine bakabilirsiniz."
            : "Bu filtreye uyan mentor yok."}
        </p>
      ) : null}
      <div className="space-y-3">
        {listedMentors.map((item) => {
          const href = mentorProfileHref(item.id);
          return (
            <Link
              key={item.id}
              href={href}
              className={`block rounded-2xl border bg-white p-4 ${
                mentorId === item.id
                  ? "border-[#e86f22] shadow-sm"
                  : "border-[#e5e7eb]"
              }`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <Avatar initials={item.initials} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#171717]">
                    {item.fullName}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#777]">
                    {item.professionalTitle} · {item.company}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.specialties.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Badge>{item.availabilityLabel}</Badge>
              </div>
              <div className="mt-4 grid gap-2 border-t border-[#f0f0f0] py-3 text-xs text-[#777] md:grid-cols-3">
                {(
                  [
                    ["meetingMode", item.meetingMode],
                    ["communicationPreference", item.communicationPreference],
                    ["mentoringStyle", item.mentoringStyle],
                  ] as const
                )
                  .filter(([, value]) => value.trim().length > 0)
                  .map(([field, value]) => (
                    <span key={field}>{value}</span>
                  ))}
              </div>
              {item.recommendationReasons.length > 0 ? (
                <div className="rounded-md bg-[#f9fafb] p-3">
                  <strong className="text-xs">Neden önerildi?</strong>
                  <ul className="mt-2 space-y-1 text-xs text-[#777]">
                    {item.recommendationReasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#e86f22]" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4">
                <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e4e7ea] bg-white px-4 text-sm font-semibold text-[#3c424a]">
                  Profili Gör
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
