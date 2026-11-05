import { ProgramContext } from "@/components/common/program-context";
import { useLocale, useTranslations } from "next-intl";

import { useTopicLabel } from "@/hooks/use-option-label";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { needLabels } from "@/lib/mentor-request-need";
import { formatRequestSentAt } from "@/lib/mentorship-workspace";
import {
  buildRequestDetailContent,
  RequestDetailFieldKey,
} from "@/lib/request-detail-content";

const HIGHLIGHTED_FIELDS: readonly RequestDetailFieldKey[] = [
  RequestDetailFieldKey.NeedProblem,
  RequestDetailFieldKey.ProfileStuck,
];

export function RequestDetailsPanel({
  request,
  showSentAt = true,
  showPreferredSlots = true,
  className = "",
}: {
  request: MentorshipRequest;
  showSentAt?: boolean;
  showPreferredSlots?: boolean;
  className?: string;
}) {
  const t = useTranslations("requestDetail");
  const tNeed = useTranslations("mentorRequest");
  const locale = useLocale();
  const topicLabel = useTopicLabel();
  const detail = buildRequestDetailContent(request, {
    labels: needLabels(tNeed),
    locale,
    topicLabel,
  });

  return (
    <div className={`space-y-3 text-sm text-[#676e78] ${className}`}>
      <ProgramContext name={request.programName} />
      {detail.fields.map((field) => (
        <div
          key={field.key}
          className={
            HIGHLIGHTED_FIELDS.includes(field.key)
              ? "rounded-[20px] border border-[var(--ms-accent,#e86f22)] px-6 py-5 text-[#22262b]"
              : "rounded-[10px] border border-[#e4e7ea] px-3.5 py-3"
          }
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
            {t(`fields.${field.key}`)}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[#22262b]">
            {field.value}
          </p>
        </div>
      ))}
      {showSentAt ? (
        <p className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
          {t("sentAtLine", {
            when: formatRequestSentAt(request.createdAt, new Date(), locale),
          })}
        </p>
      ) : null}
      {showPreferredSlots && detail.preferredSlots.length > 0 ? (
        <div className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
            {t("fields.preferredSlots")}
          </p>
          <ul className="mt-2 space-y-1 text-[#22262b]">
            {detail.preferredSlots.map((slot, index) => (
              <li key={`${slot.label}-${index}`}>{slot.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
