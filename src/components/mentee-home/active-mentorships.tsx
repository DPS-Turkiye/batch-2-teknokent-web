import Image from "next/image";
import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { SectionHeader } from "@/components/mentee-home/section-header";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { activeMentorshipFooter, requestStatusHref } from "@/lib/mentee-home";
import { initials } from "@/lib/utils";

const MENTORSHIP_LIMIT = 3;

export function ActiveMentorships({
  requests,
  openActionCountByRequest,
  nextMeetingByRequest,
  loading,
}: {
  requests: MentorshipRequest[];
  openActionCountByRequest: Record<string, number>;
  nextMeetingByRequest: Record<string, MeetingItem>;
  loading: boolean;
}) {
  return (
    <section
      aria-labelledby="home-active-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader id="home-active-title" title="Aktif Mentorluklar" />
      {requests.slice(0, MENTORSHIP_LIMIT).map((request) => {
        const footer = activeMentorshipFooter(
          openActionCountByRequest[request.id] ?? 0,
          nextMeetingByRequest[request.id] ?? null,
        );
        return (
          <article
            key={request.id}
            className="rounded-[20px] border-[0.685px] border-[#dde1e6] bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar
                initials={initials(request.mentorName) || "MN"}
                tone="orange"
              />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium leading-[21px] text-[#2b303a]">
                  {request.mentorName}
                </h3>
                <p className="truncate text-xs leading-[18px] text-[#7a828d]">
                  {request.supportArea}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t-[0.685px] border-[#eef0f3] pt-3">
              {footer.hasOpenActions ? (
                <span className="flex items-center gap-1.5 text-xs font-medium leading-[18px] text-[#c95c18]">
                  <span className="size-1.5 rounded-full bg-[#e5701d]" />
                  {footer.label}
                </span>
              ) : (
                <span className="text-xs font-medium leading-[18px] text-[#7a828d]">
                  {footer.label}
                </span>
              )}
              <Link
                href={requestStatusHref(request.id)}
                aria-label={`Mentorluğa git: ${request.mentorName}`}
                className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold leading-[18.75px] text-[#565e68] hover:text-[#22262b]"
              >
                Mentorluğa git
                <Image
                  src="/mentee-dashboard/home/chevron.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4"
                />
              </Link>
            </div>
          </article>
        );
      })}
      {!loading && requests.length === 0 && (
        <p className="rounded-[20px] border border-[#e4e7ea] bg-white p-7 text-center text-sm text-[#838c99]">
          Henüz aktif mentorluk yok.
        </p>
      )}
    </section>
  );
}
