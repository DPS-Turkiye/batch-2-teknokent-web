"use client";

import Image from "next/image";
import Link from "next/link";

import { MobileButtonLink } from "@/components/mobile/mobile-button";
import {
  HomeHeader,
  HomeMessageRow,
  HomeSection,
  QuietLine,
} from "@/components/mobile/mobile-home-parts";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
  MobileOfflineBanner,
} from "@/components/mobile/mobile-states";
import { useMobileMentorHome } from "@/hooks/use-mobile-mentor-home";
import { MobileButtonVariant } from "@/interfaces/mobile";
import { MOBILE_MESSAGES, MOBILE_STARTUPS } from "@/lib/mobile";
import type {
  MentorMeetingSummary,
  MentorStartupRow,
} from "@/lib/mobile-mentor-home";

// The card art is drawn upright; it is turned on its side to lie behind the card.
function CardArt() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 size-full"
      viewBox="0 0 368 204"
      preserveAspectRatio="none"
    >
      <image
        href="/mobile/next-meeting-card-mentor.svg"
        width="204"
        height="368"
        transform="translate(0 204) rotate(-90)"
        preserveAspectRatio="none"
      />
    </svg>
  );
}

function NextMeetingCard({ meeting }: { meeting: MentorMeetingSummary }) {
  return (
    <div className="relative -mx-2 p-2">
      <CardArt />
      <article
        aria-label="Sıradaki görüşme"
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] border border-white/50 bg-black/10 p-5 text-white"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fff1ec] text-base leading-[1.35] font-semibold text-[#e0522a]">
            {meeting.startupInitials}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-[19px] font-semibold">
                {meeting.startupName}
              </h2>
              <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[11.5px]">
                Sıradaki Görüşme
              </span>
            </div>
            <p className="truncate text-[13px]">{meeting.detail}</p>
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
          Detaylar
        </MobileButtonLink>
      </article>
    </div>
  );
}

function StartupRow({
  startup,
  last,
}: {
  startup: MentorStartupRow;
  last: boolean;
}) {
  return (
    <li className={last ? "" : "border-b border-[#f0f2f4]"}>
      <Link href={startup.href} className="flex items-center gap-3.5 py-3.5">
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[15px] bg-[#fff1ec] text-[17px] leading-[1.35] font-semibold text-[#e0522a]">
          {startup.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
          <span className="truncate text-[15.5px] font-semibold text-[#22262b]">
            {startup.name}
          </span>
          {startup.program ? (
            <span className="truncate text-[13px] text-[#858c96]">
              {startup.program}
            </span>
          ) : null}
          <span
            className={`text-[13px] font-medium ${
              startup.planned ? "text-[#1583d6]" : "text-[#b7791f]"
            }`}
          >
            {startup.next}
          </span>
        </span>
        <Image
          src="/mobile/icon-chevron-right.svg"
          alt=""
          width={18}
          height={18}
        />
      </Link>
    </li>
  );
}

export function MobileMentorHomeView() {
  const home = useMobileMentorHome();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <HomeHeader
          firstName={home.firstName}
          hasUnreadNotifications={home.hasUnreadNotifications}
        />
        {home.isOnline ? null : (
          <MobileOfflineBanner detail="Gösterilenler son kaydedilen bilgiler." />
        )}
        {home.isLoading ? (
          <MobileListSkeleton />
        ) : home.isError ? (
          <MobileErrorState
            title="Ana sayfa yüklenemedi."
            onRetry={home.retry}
          />
        ) : home.nextMeeting ? (
          <NextMeetingCard meeting={home.nextMeeting} />
        ) : (
          <MobileEmptyState
            title="Planlanmış görüşmen yok."
            description="Bir startup görüşme planladığında burada görünecek."
          />
        )}
      </div>

      {home.isLoading || home.isError ? null : (
        <>
          <HomeSection title="Startuplarım" allHref={MOBILE_STARTUPS}>
            {home.startups.length > 0 ? (
              <ul>
                {home.startups.map((startup, index) => (
                  <StartupRow
                    key={startup.id}
                    startup={startup}
                    last={index === home.startups.length - 1}
                  />
                ))}
              </ul>
            ) : (
              <QuietLine>Henüz mentorluk yaptığın bir startup yok.</QuietLine>
            )}
          </HomeSection>

          <HomeSection title="Mesajlar" allHref={MOBILE_MESSAGES}>
            {home.messages.length > 0 ? (
              <ul>
                {home.messages.map(({ message, unreadCount }) => (
                  <HomeMessageRow
                    key={message.id}
                    message={message}
                    unreadCount={unreadCount}
                    squareAvatar
                  />
                ))}
              </ul>
            ) : (
              <QuietLine>Henüz mesaj yok.</QuietLine>
            )}
          </HomeSection>
        </>
      )}
    </div>
  );
}
