import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  REQUEST_DETAIL_HIGHLIGHT_LABELS,
  REQUEST_DETAIL_LABELS,
} from "@/lib/const";
import { formatRequestSentAt } from "@/lib/mentorship-workspace";
import { buildRequestDetailContent } from "@/lib/request-detail-content";

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
  const detail = buildRequestDetailContent(request);

  return (
    <div className={`space-y-3 text-sm text-[#676e78] ${className}`}>
      {detail.fields.map((field) => (
        <div
          key={field.label}
          className={
            (REQUEST_DETAIL_HIGHLIGHT_LABELS as readonly string[]).includes(
              field.label,
            )
              ? "rounded-[20px] border border-[#e86f22] px-6 py-5 text-[#22262b]"
              : "rounded-[10px] border border-[#e4e7ea] px-3.5 py-3"
          }
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
            {field.label}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[#22262b]">
            {field.value}
          </p>
        </div>
      ))}
      {showSentAt ? (
        <p className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
          Talep gönderildi: {formatRequestSentAt(request.createdAt)}
        </p>
      ) : null}
      {showPreferredSlots && detail.preferredSlots.length > 0 ? (
        <div className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
            {REQUEST_DETAIL_LABELS.preferredSlots}
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
