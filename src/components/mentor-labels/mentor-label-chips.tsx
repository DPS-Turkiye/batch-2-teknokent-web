// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import type { MentorLabel } from "@/interfaces/mentor-label";
import { MENTOR_LABEL_PALETTE } from "@/lib/const/mentor-labels";

export function MentorLabelChip({ label }: { label: MentorLabel }) {
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${MENTOR_LABEL_PALETTE[label.color].chip}`}
    >
      {label.name}
    </span>
  );
}

/** A mentor's labels; renders nothing when there are none. */
export function MentorLabelChips({
  labels,
  className = "",
}: {
  labels: readonly MentorLabel[];
  className?: string;
}) {
  const t = useTranslations("mentorLabels");
  if (labels.length === 0) return null;
  return (
    <ul
      aria-label={t("listLabel")}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {labels.map((label) => (
        <li key={label.id} className="max-w-full">
          <MentorLabelChip label={label} />
        </li>
      ))}
    </ul>
  );
}
