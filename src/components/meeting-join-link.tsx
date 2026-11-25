"use client";

import type { MouseEvent, ReactNode } from "react";

import { openMeetingWindow } from "@/lib/meeting-window";
import { httpUrlOrNull } from "@/lib/utils";

/** The join link of a meeting: a window beside the page on a computer, a tab everywhere else. */
export function MeetingJoinLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const join = (event: MouseEvent<HTMLAnchorElement>) => {
    const asked = event.metaKey || event.ctrlKey || event.shiftKey;
    const target = httpUrlOrNull(href);
    if (asked || event.altKey || !target) return;
    if (openMeetingWindow(target)) event.preventDefault();
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={join}
      className={className}
    >
      {children}
    </a>
  );
}
