"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { MobileAccountButton } from "@/components/mobile/mobile-account-button";
import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileButtonLink } from "@/components/mobile/mobile-button";
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
  type MobileMessagePreview,
  type MobileTaskPreview,
} from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  MOBILE_MESSAGES,
  MOBILE_NOTIFICATIONS,
  MOBILE_TASKS,
} from "@/lib/mobile";
import { DueTone } from "@/types/mentee-home";

const DUE_CHIP_CLASS: Record<DueTone, string> = {
  [DueTone.Overdue]: "bg-[#fdeeee] text-[#d9464b]",
  [DueTone.Today]: "bg-[#fff6e5] text-[#b7791f]",
  [DueTone.Upcoming]: "bg-[#f5f6f8] text-[#676e78]",
  [DueTone.None]: "bg-[#f5f6f8] text-[#676e78]",
};

function Section({
  title,
  allHref,
  children,
}: {
  title: string;
  allHref: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5" aria-label={title}>
      <div className="flex items-center justify-between leading-[1.35]">
        <h2 className="text-[17px] font-semibold text-[#22262b]">{title}</h2>
        <Link
          href={allHref}
          className="text-sm font-medium text-[#676e78]"
          aria-label={`Tüm ${title.toLocaleLowerCase("tr-TR")}`}
        >
          Tümü
        </Link>
      </div>
      {children}
    </section>
  );
}

function NextMeetingCard({ meeting }: { meeting: MobileMeetingSummary }) {
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
        aria-label="Sıradaki görüşme"
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] border border-white/20 bg-black/5 p-5 text-white"
      >
        <div className="flex items-center justify-between gap-3 leading-[1.35]">
          <p className="text-[11.5px] font-semibold">SIRADAKİ GÖRÜŞME</p>
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
          Görüşme detayları
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

function MessageRow({ message }: { message: MobileMessagePreview }) {
  return (
    <li>
      <Link href={message.href} className="flex items-center gap-3 py-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eaf6ff] text-base leading-[1.35] font-semibold text-[#1583d6]">
          {message.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35] text-[#22262b]">
          <span className="truncate text-[15px] font-medium">
            {message.name}
          </span>
          <span className="truncate text-[13.5px] text-[#858c96]">
            {message.preview}
          </span>
        </span>
        <span className="shrink-0 self-start pt-0.5 text-xs leading-[1.35] text-[#858c96]">
          {message.time}
        </span>
      </Link>
    </li>
  );
}

function QuietLine({ children }: { children: ReactNode }) {
  return (
    <p className="py-3.5 text-[13.5px] leading-[1.35] text-[#858c96]">
      {children}
    </p>
  );
}

export function MobileHomeView() {
  const home = useMobileHome();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h1 className="text-lg leading-[1.35] text-[#858c96]">
            {home.firstName ? `Merhaba, ${home.firstName}` : "Merhaba"}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={MOBILE_NOTIFICATIONS}
              aria-label={
                home.hasUnreadNotifications
                  ? "Bildirimler, okunmamış bildirim var"
                  : "Bildirimler"
              }
              className="relative flex size-11 items-center justify-center rounded-full bg-[#f5f6f8]"
            >
              <Image
                src="/mobile/icon-bell.svg"
                alt=""
                width={22}
                height={22}
              />
              {home.hasUnreadNotifications ? (
                <span
                  aria-hidden="true"
                  className="absolute top-[9px] right-2 size-[9px] rounded-full border-2 border-white bg-[var(--mobile-accent)]"
                />
              ) : null}
            </Link>
            <MobileAccountButton />
          </div>
        </header>

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
            description="Yeni bir görüşme planlandığında burada görünecek."
          />
        )}
      </div>

      {home.isLoading || home.isError ? null : (
        <>
          <Section title="Yapılacaklar" allHref={MOBILE_TASKS}>
            {home.isLoadingTasks ? (
              <MobileListSkeleton label="Yapılacaklar yükleniyor" />
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
              <QuietLine>Şu an yapılacak bir şey yok.</QuietLine>
            )}
          </Section>

          <Section title="Mesajlar" allHref={MOBILE_MESSAGES}>
            {home.messages.length > 0 ? (
              <ul>
                {home.messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))}
              </ul>
            ) : (
              <QuietLine>Henüz mesaj yok.</QuietLine>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

/** The mentor home is its own screen; until it lands mentors keep the placeholder. */
export function MobileHomeScreen() {
  const { session } = useSession();
  if (session?.role === UserRole.Mentor) {
    return (
      <>
        <MobileScreenHeader
          title="Ana Sayfa"
          action={<MobileAccountButton />}
        />
        <MobileEmptyState
          title="Ana sayfa hazırlanıyor."
          description="Sıradaki görüşmen ve startupların yakında burada."
        />
      </>
    );
  }
  return <MobileHomeView />;
}
