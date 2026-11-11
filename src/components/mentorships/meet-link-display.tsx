"use client";

import { useTranslations } from "next-intl";

import { meetLinkHref } from "@/lib/meet-link";

export function MeetLinkDisplay({
  meetLink,
  className = "",
}: {
  meetLink?: string | null | undefined;
  className?: string;
}) {
  const t = useTranslations("meetLink");
  if (!meetLink) {
    return (
      <p className={`text-[13px] text-[#858c96] ${className}`}>
        {t("missing")}
      </p>
    );
  }

  return (
    <a
      href={meetLinkHref(meetLink)}
      target="_blank"
      rel="noopener noreferrer"
      className={`block truncate text-[13px] font-medium text-[var(--ms-accent,#e86f22)] hover:underline ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {meetLink}
    </a>
  );
}
