import Image from "next/image";
import Link from "next/link";

import { SectionHeader } from "@/components/mentee-home/section-header";
import { SectionPlaceholder } from "@/components/mentee-home/section-placeholder";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { meetingDayLabel } from "@/lib/mentee-home";

export function MeetingNotes({
  meetings,
  totalCount,
  openTodoCounts,
  requestsById,
  loading,
}: {
  meetings: MeetingItem[];
  totalCount: number;
  openTodoCounts: Map<string, number>;
  requestsById: Record<string, MentorshipRequest>;
  loading: boolean;
}) {
  return (
    <section
      aria-labelledby="home-notes-title"
      className="flex flex-col gap-2.5"
    >
      <SectionHeader
        id="home-notes-title"
        title="Toplantı Notların"
        href="/notes"
        linkText={`Tümü (${totalCount})`}
      />
      {meetings.map((meeting) => {
        const openTodos = openTodoCounts.get(meeting.id);
        const request = meeting.mentorshipRequestId
          ? requestsById[meeting.mentorshipRequestId]
          : undefined;
        return (
          <Link
            key={meeting.id}
            href="/notes"
            className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-3 hover:bg-[#fcfcfd]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff2ec]">
                <Image
                  src="/mentee-dashboard/home/notebook.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="size-6"
                />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-normal leading-5 text-[#22262b]">
                  {meeting.agenda || "Mentorluk görüşmesi"}
                </strong>
                <small className="block truncate text-xs leading-6 text-[#676e78]">
                  {[meeting.mentorName, request?.supportArea]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs leading-5 text-[#858c96]">
                {meetingDayLabel(meeting)}
              </span>
              {openTodos !== undefined && (
                <span
                  className={`text-[11.5px] font-medium leading-[17.25px] ${openTodos > 0 ? "text-[#f97316] underline" : "text-[#676e78]"}`}
                >
                  {openTodos > 0
                    ? "Görevler tamamlanmadı"
                    : "Görevler tamamlandı"}
                </span>
              )}
            </span>
          </Link>
        );
      })}
      {meetings.length === 0 && (
        <SectionPlaceholder
          loading={loading}
          emptyText="Henüz gerçekleşen bir görüşmen yok."
        />
      )}
    </section>
  );
}
