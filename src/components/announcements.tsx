"use client";

import { Megaphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type {
  AnnouncementThread,
  ProgramAnnouncement,
} from "@/interfaces/program-announcement";
import {
  conversationTime,
  messageDayLabel,
  messageTime,
} from "@/lib/coordinator-messages";
import { MAX_ANNOUNCEMENT_LENGTH } from "@/lib/program-announcements";

type Accent = { strong: string; soft: string };

function useAudienceLabel() {
  const t = useTranslations("announcements");
  return (announcement: ProgramAnnouncement | null) =>
    announcement
      ? t("audience", {
          teams: announcement.teamCount,
          mentors: announcement.mentorCount,
        })
      : t("none");
}

/** The "Duyurular" rows: one read-only thread per program. Hidden when there are none. */
export function AnnouncementThreadList({
  threads,
  activeProgramId,
  accent,
  onSelect,
}: {
  threads: AnnouncementThread[];
  activeProgramId: string | null;
  accent: Accent;
  onSelect: (programId: string) => void;
}) {
  const t = useTranslations("announcements");
  const locale = useLocale();
  const audienceLabel = useAudienceLabel();
  if (!threads.length) return null;
  return (
    <section aria-label={t("label")}>
      <h2 className="border-t border-[#eef0f3] px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#858c96]">
        {t("title")}
      </h2>
      <ul>
        {threads.map((thread) => {
          const selected = thread.programId === activeProgramId;
          return (
            <li key={thread.programId}>
              <button
                type="button"
                onClick={() => onSelect(thread.programId)}
                style={selected ? { backgroundColor: accent.soft } : undefined}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "" : "hover:bg-[#fafbfc]"}`}
              >
                <span
                  className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f3f4f6]"
                  style={{ color: accent.strong }}
                >
                  <Megaphone aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <b className="truncate text-[13px] font-semibold">
                      {t("threadName", { program: thread.programName })}
                    </b>
                    <span className="shrink-0 text-[10px] text-[#858c96]">
                      {conversationTime(
                        thread.latest?.createdAt ?? null,
                        new Date(),
                        locale,
                      )}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-[#676e78]">
                    {audienceLabel(thread.latest)}
                  </span>
                  <span className="mt-1 block truncate text-[10.5px] text-[#858c96]">
                    {thread.latest?.body ?? t("none")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type Composer = {
  draft: string;
  setDraft: (value: string) => void;
  canSend: boolean;
  send: () => void;
  sendError: Error | null;
};

/** A program's announcements, oldest first like a chat. Read-only unless a composer is passed (the coordinator). */
export function AnnouncementPane({
  thread,
  accent,
  composer,
  className = "",
}: {
  thread: AnnouncementThread;
  accent: Accent;
  composer?: Composer;
  className?: string;
}) {
  const t = useTranslations("announcements");
  const locale = useLocale();
  const audienceLabel = useAudienceLabel();
  const chronological = [...thread.announcements].reverse();
  return (
    <section className={`flex min-h-0 flex-col bg-white ${className}`}>
      <header className="border-b border-[#e4e7ea] px-6 py-4">
        <h2 className="text-[15px] font-semibold">
          {t("threadName", { program: thread.programName })}
        </h2>
        <p className="mt-0.5 text-[12px] text-[#676e78]">
          {audienceLabel(thread.latest)}
        </p>
      </header>
      <div className="min-h-[240px] flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {chronological.length ? (
          chronological.map((announcement) => (
            <article
              key={announcement.id}
              className="flex flex-col items-start"
            >
              <p className="text-[10.5px] text-[#858c96]">
                {messageDayLabel(announcement.createdAt, new Date(), locale)}
              </p>
              <div className="mt-1 max-w-[560px] rounded-xl border border-[#e4e7ea] bg-[#f6f7f9] px-3.5 py-3 text-[13px] leading-5">
                <p
                  className="mb-1 text-[10.5px] font-medium"
                  style={{ color: accent.strong }}
                >
                  {announcement.authorName ?? t("authorFallback")}
                </p>
                <p className="whitespace-pre-wrap">{announcement.body}</p>
              </div>
              <time className="mt-1 text-[10px] text-[#858c96]">
                {messageTime(announcement.createdAt, locale)}
              </time>
            </article>
          ))
        ) : (
          <p className="text-[12px] text-[#858c96]">{t("empty")}</p>
        )}
      </div>
      {composer ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            composer.send();
          }}
          className="border-t border-[#e4e7ea] px-6 py-4"
        >
          <div className="flex items-end gap-3">
            <textarea
              value={composer.draft}
              onChange={(event) => composer.setDraft(event.target.value)}
              maxLength={MAX_ANNOUNCEMENT_LENGTH}
              rows={2}
              aria-label={t("inputLabel")}
              placeholder={t("placeholder")}
              className="min-w-0 flex-1 resize-none rounded-2xl border border-[#e9ecef] px-4 py-2 text-[13px] outline-none"
            />
            <button
              type="submit"
              disabled={!composer.canSend}
              style={{ backgroundColor: accent.strong }}
              className="h-9 rounded-full px-[18px] text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {t("send")}
            </button>
          </div>
          {composer.sendError ? (
            <p role="alert" className="mt-2 text-[12px] text-[#d9464b]">
              {composer.sendError.message}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="border-t border-[#e4e7ea] px-6 py-3 text-[12px] text-[#858c96]">
          {t("readOnly")}
        </p>
      )}
    </section>
  );
}
