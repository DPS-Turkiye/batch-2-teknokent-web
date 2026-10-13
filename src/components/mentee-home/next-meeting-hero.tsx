import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Avatar } from "@/components/common/avatar";
import type { MeetingItem } from "@/interfaces/meeting";
import { meetingWhenLabel } from "@/lib/mentee-home";
import { meetingCallHref } from "@/lib/mentorship-workspace";
import { initials } from "@/lib/utils";
import { RescheduleMeetingButton } from "@/components/reschedule-meeting-button";

const whiteButton =
  "inline-flex items-center justify-center rounded-full border border-white bg-white px-3.5 py-2 text-[12.5px] font-medium leading-[18px] text-[#4a5059] hover:bg-[#fff7f1]";
const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-[#e86f22] px-3.5 py-2 text-[12.5px] font-medium leading-[18px] text-white hover:bg-[#d9631c]";

export function NextMeetingHero({
  meeting,
  loading,
}: {
  meeting: MeetingItem | null;
  loading: boolean;
}) {
  const t = useTranslations("menteeHome");
  const locale = useLocale();
  return (
    <section
      aria-label={t("hero.label")}
      className="relative flex min-h-[160px] items-center overflow-hidden rounded-[24px] px-4 py-6 sm:px-12"
    >
      {/* The Figma gradient is drawn vertically; turning it sideways lays it across the banner. */}
      <Image
        src="/mentee-dashboard/home/hero-gradient.svg"
        alt=""
        width={160}
        height={1400}
        priority
        className="pointer-events-none absolute left-1/2 top-1/2 h-[1400px] w-[400px] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90 sm:w-[160px]"
      />
      <div className="relative flex w-full flex-col gap-3 rounded-[20px] border border-white bg-white/30 px-[18px] py-4 sm:flex-row sm:items-center sm:justify-between">
        {meeting ? (
          <>
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                initials={initials(meeting.mentorName ?? "") || "MN"}
                tone="orange"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] leading-[19px] text-white">
                  {meeting.mentorName ?? t("mentorFallback")}
                </p>
                <h2 className="truncate text-[15px] font-semibold leading-[22px] text-white">
                  {meeting.agenda || t("meetingFallback")}
                </h2>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <p className="flex items-center gap-1.5 text-[12.5px] leading-[18px] text-white">
                <Image
                  src="/mentee-dashboard/home/clock.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="size-3.5"
                />
                {meetingWhenLabel(meeting, { t, locale })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/messages" className={whiteButton}>
                  {t("messageMentor")}
                </Link>
                <RescheduleMeetingButton
                  meeting={meeting}
                  pairLabel={meeting.mentorName ?? t("mentorFallback")}
                  className={whiteButton}
                />
                <Link
                  href={meetingCallHref(meeting.id)}
                  className={primaryButton}
                >
                  {t("joinMeeting")}
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-[22px] text-white">
                {loading ? t("hero.loading") : t("hero.empty")}
              </h2>
              <p className="text-[13px] leading-[19px] text-white">
                {t("hero.emptyBody")}
              </p>
            </div>
            {!loading && (
              <Link href="/calendar" className={primaryButton}>
                {t("hero.plan")}
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
