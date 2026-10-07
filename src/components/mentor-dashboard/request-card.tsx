import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { mentorRequestStartupHref } from "@/lib/mentorship-workspace";

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul Edildi",
  [MentorshipRequestStatus.CounterProposed]: "Saat Önerildi",
  [MentorshipRequestStatus.Declined]: "Uygun Değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek Bilgi İstendi",
  [MentorshipRequestStatus.Pending]: "Yanıt Bekliyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri Çekildi",
};

const statusTones: Record<
  MentorshipRequestStatus,
  "gray" | "green" | "amber" | "purple"
> = {
  [MentorshipRequestStatus.Accepted]: "green",
  [MentorshipRequestStatus.CounterProposed]: "amber",
  [MentorshipRequestStatus.Declined]: "gray",
  [MentorshipRequestStatus.MoreInfoRequested]: "purple",
  [MentorshipRequestStatus.Pending]: "amber",
  [MentorshipRequestStatus.Withdrawn]: "gray",
};

export function MentorRequestCard({
  request,
  onReview,
}: {
  request: MentorshipRequest;
  onReview: (request: MentorshipRequest) => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar
              initials={
                request.organizationName?.substring(0, 2).toUpperCase() ?? "GR"
              }
            />
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {request.organizationName ?? "Girişim"}
              </h3>
              <p className="text-xs text-zinc-500">Girişimci Destek Talebi</p>
            </div>
          </div>
          <Badge tone={statusTones[request.status]}>
            {statusLabels[request.status]}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg bg-zinc-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Destek Alanı
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-800">
            {request.supportArea}
          </p>
        </div>

        {request.recommendationSnapshot?.startupSector ||
        request.recommendationSnapshot?.startupStage ? (
          <p className="mt-2 text-xs text-zinc-500">
            {[
              request.recommendationSnapshot.startupSector,
              request.recommendationSnapshot.startupStage,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}

        {request.mentorMessage ? (
          <div className="mt-3 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-700">Mentor Notu:</span>{" "}
            {request.mentorMessage}
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-2 border-t border-zinc-100 pt-3">
        <button
          type="button"
          onClick={() => onReview(request)}
          className="w-full rounded-lg bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-800"
        >
          Talebi İncele &amp; Yanıtla →
        </button>
        {request.status === MentorshipRequestStatus.Accepted ? (
          <Link
            href={mentorRequestStartupHref(request.id)}
            className="block w-full rounded-lg border border-zinc-300 py-2 text-center text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Süreci Görüntüle
          </Link>
        ) : null}
      </div>
    </article>
  );
}
