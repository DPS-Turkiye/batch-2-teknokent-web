// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { MentorLabelChips } from "@/components/mentor-labels/mentor-label-chips";
import { useMentorProgramLabels } from "@/hooks/use-mentor-labels";

/**
 * A mentor's labels on a profile, one program at a time: a picker appears when the viewer may see the mentor's
 * labels in two or more programs. View only; coordinators edit them on Mentor Havuzu.
 */
export function MentorProgramLabels({
  mentorId,
  own = false,
  className = "",
}: {
  mentorId: string;
  own?: boolean;
  className?: string;
}) {
  const t = useTranslations("mentorLabels");
  const pickerId = useId();
  const headingId = useId();
  const labels = useMentorProgramLabels(mentorId);
  if (!labels.visible || !labels.current) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-[20px] border border-[#e4e7ea] bg-white p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-[15px] font-semibold text-[#22262b]">
          {t("profileTitle")}
        </h2>
        {labels.showPicker ? (
          <label
            htmlFor={pickerId}
            className="flex items-center gap-2 text-[12.5px] text-[#676e78]"
          >
            {t("programPicker")}
            <select
              id={pickerId}
              value={labels.current.programId}
              onChange={(event) => labels.pick(event.target.value)}
              className="h-9 rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] px-3 text-[13px] text-[#22262b]"
            >
              {labels.programs.map((program) => (
                <option key={program.programId} value={program.programId}>
                  {program.programName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="text-[12.5px] text-[#676e78]">
            {labels.current.programName}
          </span>
        )}
      </div>
      <MentorLabelChips labels={labels.current.labels} className="mt-3" />
      {own ? (
        <p className="mt-3 text-[12px] text-[#858c96]">{t("ownHint")}</p>
      ) : null}
    </section>
  );
}
