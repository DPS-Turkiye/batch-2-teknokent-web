"use client";

import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { AppShell } from "@/components/hoc/app-shell";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const requestStatusLabels = {
  [MentorshipRequestStatus.Accepted]: "Kabul edildi",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

export default function MentorshipsPage() {
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const requests = requestsQuery.data ?? [];

  return (
    <AppShell active={AppArea.Mentorships} title="Mentorluklarım">
      <div className="mx-auto w-full max-w-[820px] space-y-3 px-4 pb-12 pt-6 sm:px-8">
        {requestsQuery.isLoading ? (
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6a7282]">
            Yükleniyor...
          </div>
        ) : requestsQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {requestsQuery.error.message}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6a7282]">
            Henüz bir mentorluk talebiniz yok.
          </div>
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
              className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 transition hover:border-[#c7c7c7] sm:items-center"
            >
              <Avatar initials={initials(request.mentorName) || "MN"} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#171717]">
                  {request.supportArea}
                </h3>
                <p className="mt-0.5 text-xs text-[#6a7282]">
                  {request.mentorName}
                </p>
                <div className="mt-2">
                  <Badge>{requestStatusLabels[request.status]}</Badge>
                </div>
              </div>
              <p className="text-left text-xs text-[#aaa] sm:text-right">
                {new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "medium",
                }).format(new Date(request.createdAt))}
              </p>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
