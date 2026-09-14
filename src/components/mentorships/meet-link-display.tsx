"use client";

import { MEET_LINK_MISSING_MESSAGE } from "@/lib/const";
import { meetLinkHref } from "@/lib/meet-link";

export function MeetLinkDisplay({
  meetLink,
  className = "",
}: {
  meetLink?: string | null;
  className?: string;
}) {
  if (!meetLink) {
    return (
      <p className={`text-[13px] text-[#858c96] ${className}`}>
        {MEET_LINK_MISSING_MESSAGE}
      </p>
    );
  }

  return (
    <a
      href={meetLinkHref(meetLink)}
      target="_blank"
      rel="noopener noreferrer"
      className={`block truncate text-[13px] font-medium text-[#e86f22] hover:underline ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {meetLink}
    </a>
  );
}
