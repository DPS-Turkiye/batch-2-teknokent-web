import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { SectionHeader } from "@/components/mentee-home/section-header";
import { SectionPlaceholder } from "@/components/mentee-home/section-placeholder";
import { RescheduleMeetingButton } from "@/components/reschedule-meeting-button";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { meetingWhenLabel } from "@/lib/mentee-home";
import { meetingCallHref } from "@/lib/mentorship-workspace";

const MEETING_LIMIT = 2;

export function UpcomingMeetings({
  meetings,
  requestsById,
  loading,
}: {
  meetings: MeetingItem[];
  requestsById: Record<string, MentorshipRequest>;
  loading: boolean;
}) {
  const t = useTranslations("menteeHome");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="home-upcoming-title"
      className="flex flex-col gap-2.5"
    >
      <SectionHeader
        id="home-upcoming-title"
        title={t("upcoming.title")}
        href="/calendar"
        linkText={t("upcoming.openCalendar")}
      />
      {meetings.slice(0, MEETING_LIMIT).map((meeting) => {
        const request = meeting.mentorshipRequestId
          ? requestsById[meeting.mentorshipRequestId]
          : undefined;
        return (
          <article
            key={meeting.id}
            className="flex flex-col gap-2.5 rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] leading-[19px] text-[#676e78]">
                  {[meeting.mentorName, request?.supportArea]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h3 className="truncate text-[15px] font-semibold leading-[22px] text-[#22262b]">
                  {meeting.agenda || t("meetingFallback")}
                </h3>
                <p className="text-xs leading-[18px] text-[#858c96]">
                  {meetingWhenLabel(meeting, { t, locale })}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-2.5 py-1 text-[11.5px] font-medium leading-[17px] text-[#676e78]">
                {t("upcoming.planned")}
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href="/messages"
                className="inline-flex items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-3.5 py-2 text-[12.5px] font-medium leading-[18px] text-[#4a5059] hover:bg-[#f8f9fa]"
              >
                {t("messageMentor")}
              </Link>
              <RescheduleMeetingButton
                meeting={meeting}
                pairLabel={meeting.mentorName ?? t("mentorFallback")}
                className="inline-flex items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-3.5 py-2 text-[12.5px] font-medium leading-[18px] text-[#4a5059] hover:bg-[#f8f9fa]"
              />
              <Link
                href={meetingCallHref(meeting.id)}
                className="inline-flex items-center justify-center rounded-full bg-[#ffb28a] px-3.5 py-2 text-[12.5px] font-medium leading-[18px] text-white hover:bg-[#f79a6b]"
              >
                {t("joinMeeting")}
              </Link>
            </div>
          </article>
        );
      })}
      {meetings.length === 0 && (
        <SectionPlaceholder loading={loading} emptyText={t("upcoming.empty")} />
      )}
    </section>
  );
}
