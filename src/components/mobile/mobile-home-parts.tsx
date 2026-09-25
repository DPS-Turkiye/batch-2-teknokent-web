"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { MobileAccountButton } from "@/components/mobile/mobile-account-button";
import type { MobileMessagePreview } from "@/interfaces/mobile";
import { MOBILE_NOTIFICATIONS } from "@/lib/mobile";

/** Greeting, the bell (dotted while something is unread) and the account button. */
export function HomeHeader({
  firstName,
  hasUnreadNotifications,
}: {
  firstName: string;
  hasUnreadNotifications: boolean;
}) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-lg leading-[1.35] text-[#858c96]">
        {firstName ? `Merhaba, ${firstName}` : "Merhaba"}
      </h1>
      <div className="flex items-center gap-2">
        <Link
          href={MOBILE_NOTIFICATIONS}
          aria-label={
            hasUnreadNotifications
              ? "Bildirimler, okunmamış bildirim var"
              : "Bildirimler"
          }
          className="relative flex size-11 items-center justify-center rounded-full bg-[#f5f6f8]"
        >
          <Image src="/mobile/icon-bell.svg" alt="" width={22} height={22} />
          {hasUnreadNotifications ? (
            <span
              aria-hidden="true"
              className="absolute top-[9px] right-2 size-[9px] rounded-full border-2 border-white bg-[var(--mobile-accent)]"
            />
          ) : null}
        </Link>
        <MobileAccountButton />
      </div>
    </header>
  );
}

export function HomeSection({
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

/** A conversation row; mentors see startups with square avatars, mentees see mentors. */
export function HomeMessageRow({
  message,
  unreadCount = 0,
  squareAvatar = false,
}: {
  message: MobileMessagePreview;
  unreadCount?: number;
  squareAvatar?: boolean;
}) {
  return (
    <li>
      <Link href={message.href} className="flex items-center gap-3 py-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center text-base leading-[1.35] font-semibold ${
            squareAvatar
              ? "rounded-[14px] bg-[#fff1ec] text-[#e0522a]"
              : "rounded-full bg-[#eaf6ff] text-[#1583d6]"
          }`}
        >
          {message.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35] text-[#22262b]">
          <span
            className={`truncate text-[15px] ${
              unreadCount > 0 ? "font-semibold" : "font-medium"
            }`}
          >
            {message.name}
          </span>
          <span
            className={`truncate text-[13.5px] ${
              unreadCount > 0 ? "font-medium" : "text-[#858c96]"
            }`}
          >
            {message.preview}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5 self-start pt-0.5 leading-[1.35]">
          <span className="text-xs text-[#858c96]">{message.time}</span>
          {unreadCount > 0 ? (
            <span
              aria-label={`${unreadCount} okunmamış mesaj`}
              className="rounded-full bg-[var(--mobile-accent)] px-[7px] py-px text-[11px] font-semibold text-white"
            >
              {unreadCount}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function QuietLine({ children }: { children: ReactNode }) {
  return (
    <p className="py-3.5 text-[13.5px] leading-[1.35] text-[#858c96]">
      {children}
    </p>
  );
}
