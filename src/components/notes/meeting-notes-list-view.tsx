"use client";

import Link from "next/link";

import { AppShell } from "@/components/hoc/app-shell";
import { useMeetings } from "@/hooks/use-meetings";
import { formatSlotDateTime } from "@/lib/format";
import { AppArea } from "@/types/app-area";

export function MeetingNotesListView() {
  const meetingsQuery = useMeetings();
  const meetings = meetingsQuery.data ?? [];

  return (
    <AppShell
      active={AppArea.Notes}
      title="Not Defterleri"
      subtitle="Her toplantının kendi ortak not defteri ve yapılacaklar listesi var."
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        {meetingsQuery.isLoading ? (
          <p className="text-sm text-[#8a8a8a]">Toplantılar yükleniyor…</p>
        ) : meetingsQuery.isError ? (
          <p className="text-sm text-[#9b2c2c]">
            Toplantı listesi şu an alınamıyor.
          </p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">
            Henüz kayıtlı bir toplantı yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {meetings.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/notes/${meeting.id}`}
                  className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 hover:border-[#c7c2f7]"
                >
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-medium text-[#171717]">
                      {meeting.agenda ?? "Mentorluk Görüşmesi"}
                    </strong>
                    <span className="mt-0.5 block text-xs text-[#8a8a8a]">
                      {formatSlotDateTime(meeting.scheduledAt)} ·{" "}
                      {meeting.durationMinutes} dk
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[#6a7282]">
                    Not defterini aç →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
