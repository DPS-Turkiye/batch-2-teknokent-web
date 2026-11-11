"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { MobileButtonLink } from "@/components/mobile/mobile-button";
import {
  HomeHeader,
  HomeMessageRow,
  HomeSection,
  QuietLine,
} from "@/components/mobile/mobile-home-parts";
import { MobileMentorHomeView } from "@/components/mobile/mobile-mentor-home-view";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
  MobileOfflineBanner,
} from "@/components/mobile/mobile-states";
import { useSession } from "@/components/providers/session-provider";
import { useMobileHome } from "@/hooks/use-mobile-home";
import {
  MobileButtonVariant,
  type MobileMeetingSummary,
  type MobileTaskPreview,
} from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import { MOBILE_MESSAGES, MOBILE_TASKS } from "@/lib/mobile";
import { DueTone } from "@/types/mentee-home";

const DUE_CHIP_CLASS: Record<DueTone, string> = {
  [DueTone.Overdue]: "bg-[#fdeeee] text-[#d9464b]",
  [DueTone.Today]: "bg-[#fff6e5] text-[#b7791f]",
  [DueTone.Upcoming]: "bg-[#f5f6f8] text-[#676e78]",
  [DueTone.None]: "bg-[#f5f6f8] text-[#676e78]",
};

function NextMeetingCard({ meeting }: { meeting: MobileMeetingSummary }) {
  const t = useTranslations("mobile.home");
  return (
    <div className="relative -mx-2 p-2">
      <Image
        src="/mobile/next-meeting-card.svg"
        alt=""
        fill
        className="object-fill"
        priority
      />
      <article
        aria-label={t("nextMeeting")}
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] border border-white/20 bg-black/5 p-5 text-white"
      >
        <div className="flex items-center justify-between gap-3 leading-[1.35]">
          <p className="text-[11.5px] font-semibold">{t("nextMeetingCaps")}</p>
          <span className="rounded-full bg-white/10 px-2.5 py-[5px] text-xs font-medium">
            {meeting.whenChip}
          </span>
        </div>
        <h2 className="text-[19px] leading-[1.35] font-semibold">
          {meeting.title}
        </h2>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf6ff] text-[13px] leading-[1.35] font-semibold text-[#1583d6]">
            {meeting.mentorInitials}
          </span>
          <div className="flex min-w-0 flex-col gap-px leading-[1.35]">
            <p className="truncate text-[14.5px] font-medium">
              {meeting.mentorName}
            </p>
            <p className="text-[12.5px]">{meeting.mentorDetail}</p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-[13px] leading-[1.35]">
          <Image
            src="/mobile/icon-time-light.svg"
            alt=""
            width={16}
            height={16}
          />
          {meeting.timeLine}
        </p>
        <MobileButtonLink
          href={meeting.href}
          variant={MobileButtonVariant.Secondary}
        >
          {t("meetingDetails")}
        </MobileButtonLink>
      </article>
    </div>
  );
}

function TaskRow({ task, last }: { task: MobileTaskPreview; last: boolean }) {
  return (
    <li className={last ? "" : "border-b border-[#f0f2f4]"}>
      <Link href={task.href} className="flex items-center gap-3.5 py-3.5">
        <span
          aria-hidden="true"
          className="size-6 shrink-0 rounded-lg border-[1.8px] border-[#cbd0d6]"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
          <span className="text-[15px] font-medium text-[#22262b]">
            {task.title}
          </span>
          <span className="truncate text-[12.5px] text-[#858c96]">
            {task.subtitle}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-[5px] text-xs leading-[1.35] font-medium ${DUE_CHIP_CLASS[task.dueTone]}`}
        >
          {task.dueLabel}
        </span>
      </Link>
    </li>
  );
}

export function MobileHomeView() {
  const t = useTranslations("mobile.home");
  const home = useMobileHome();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <HomeHeader
          firstName={home.firstName}
          hasUnreadNotifications={home.hasUnreadNotifications}
        />

        {home.isOnline ? null : (
          <MobileOfflineBanner detail={t("offlineDetail")} />
        )}

        {home.isLoading ? (
          <MobileListSkeleton />
        ) : home.isError ? (
          <MobileErrorState title={t("loadError")} onRetry={home.retry} />
        ) : home.nextMeeting ? (
          <NextMeetingCard meeting={home.nextMeeting} />
        ) : (
          <MobileEmptyState
            title={t("noMeeting")}
            description={t("noMeetingHint")}
          />
        )}
      </div>

      {home.isLoading || home.isError ? null : (
        <>
          <HomeSection title={t("tasks")} allHref={MOBILE_TASKS}>
            {home.isLoadingTasks ? (
              <MobileListSkeleton label={t("tasksLoading")} />
            ) : home.tasks.length > 0 ? (
              <ul>
                {home.tasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    last={index === home.tasks.length - 1}
                  />
                ))}
              </ul>
            ) : (
              <QuietLine>{t("noTasks")}</QuietLine>
            )}
          </HomeSection>

          <HomeSection title={t("messages")} allHref={MOBILE_MESSAGES}>
            {home.messages.length > 0 ? (
              <ul>
                {home.messages.map((message) => (
                  <HomeMessageRow key={message.id} message={message} />
                ))}
              </ul>
            ) : (
              <QuietLine>{t("noMessages")}</QuietLine>
            )}
          </HomeSection>
        </>
      )}
    </div>
  );
}

/** Mentors and mentees share the /m route but see their own home. */
export function MobileHomeScreen() {
  const { session } = useSession();
  return session?.role === UserRole.Mentor ? (
    <MobileMentorHomeView />
  ) : (
    <MobileHomeView />
  );
}
