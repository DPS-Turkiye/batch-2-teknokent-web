"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { SyncMeetingActions } from "@/components/calendar/sync-meeting-actions";
import type { MeetingItem } from "@/interfaces/meeting";
import { meetingNotebookHref } from "@/lib/startup-meetings";

export function MeetingDetailModal({
  meeting,
  onClose,
}: {
  meeting: MeetingItem;
  onClose: () => void;
}) {
  const t = useTranslations("calendar.detail");
  const locale = useLocale();
  const meetLink =
    meeting.meetLink && /^https?:\/\//i.test(meeting.meetLink)
      ? meeting.meetLink
      : null;

  return (
    <ModalDialog labelledBy="meeting-detail-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <h2
          id="meeting-detail-title"
          className="text-lg font-semibold text-[#22262b]"
        >
          {meeting.agenda ?? t("fallback")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="text-[#a4aab2] hover:text-[#676e78]"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 rounded-xl bg-[#f8f9fa] p-4 text-xs text-[#676e78]">
        <p>
          <strong className="text-[#22262b]">{t("when")}</strong>{" "}
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "full",
            timeStyle: "short",
          }).format(new Date(meeting.scheduledAt))}
        </p>
        <p>
          <strong className="text-[#22262b]">{t("duration")}</strong>{" "}
          {t("minutes", { count: meeting.durationMinutes })}
        </p>
        {meeting.mentorName ? (
          <p>
            <strong className="text-[#22262b]">{t("mentor")}</strong>{" "}
            {meeting.mentorName}
          </p>
        ) : null}
      </div>

      {meetLink ? (
        <a
          href={meetLink}
          target="_blank"
          rel="noreferrer"
          className="block truncate rounded-lg border border-[#e4e7ea] bg-[#f8f9fa] p-2.5 font-mono text-xs text-[#2f7ff0] underline"
        >
          {meetLink}
        </a>
      ) : (
        <p className="text-xs text-[#676e78]">{t("noLink")}</p>
      )}

      <SyncMeetingActions meeting={meeting} />

      <Link
        href={meetingNotebookHref(meeting.id)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#e86f22] px-4 text-xs font-semibold text-white transition hover:bg-[#ce5e19]"
      >
        <ClipboardList className="size-4" aria-hidden />
        {t("prepare")}
      </Link>
    </ModalDialog>
  );
}
