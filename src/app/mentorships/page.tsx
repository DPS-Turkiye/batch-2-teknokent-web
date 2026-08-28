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
      <div className="mx-auto w-full max-w-[1080px] space-y-5 px-4 pb-12 pt-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#e86f22]">
              Mentorluk alanın
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Tüm süreçlerin tek yerde
            </h2>
            <p className="mt-2 text-sm text-[#676e78]">
              Aktif, bekleyen ve tamamlanan mentor taleplerini takip et.
            </p>
          </div>
          <Link
            href="/mentor-request"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#e86f22] px-4 text-sm font-semibold text-white hover:bg-[#ce5e19]"
          >
            Yeni mentor talebi
          </Link>
        </div>
        <div className="flex gap-2 border-b border-[#e4e7ea] pb-3">
          <span className="rounded-full bg-[#fdebdd] px-4 py-2 text-xs font-semibold text-[#c85816]">
            Tümü
          </span>
          <span className="rounded-full px-4 py-2 text-xs font-medium text-[#676e78]">
            Aktif
          </span>
          <span className="rounded-full px-4 py-2 text-xs font-medium text-[#676e78]">
            Geçmiş
          </span>
        </div>
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
              className="flex items-start gap-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 transition hover:border-[#f2b78f] hover:shadow-sm sm:items-center"
            >
              <Avatar
                initials={initials(request.mentorName) || "MN"}
                tone="orange"
              />
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
