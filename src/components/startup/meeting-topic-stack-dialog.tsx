"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  MeetingFiles,
  MeetingPerson,
  MeetingWhen,
  TimingBadge,
} from "@/components/startup/meeting-card-parts";
import type { MeetingDetails } from "@/hooks/use-startup-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import { meetingTiming, type MeetingTopic } from "@/lib/startup-meetings";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MeetingTopicStackDialog({
  details,
  onClose,
  onOpenFile,
  onSelectMeeting,
  topic,
}: {
  details: (meeting: MeetingItem) => MeetingDetails;
  onClose: () => void;
  onOpenFile: (documentId: string) => void;
  onSelectMeeting: (meetingId: string) => void;
  topic: MeetingTopic;
}) {
  const t = useTranslations("startupMeetings");
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    (dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-stack-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[min(796px,calc(100vh-4rem))] w-full max-w-[743px] flex-col gap-3 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-4">
          <h2
            id="topic-stack-title"
            className="text-xl leading-7 text-[#e86f22]"
          >
            {topic.title}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center text-[#858c96] hover:text-[#22262b]"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <ul className="flex flex-col gap-3">
          {topic.meetings.map((meeting) => {
            const { files, mentorTitle, summary } = details(meeting);
            const timing = meetingTiming(meeting);
            return (
              <li key={meeting.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMeeting(meeting.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectMeeting(meeting.id);
                    }
                  }}
                  className="w-full cursor-pointer space-y-3 rounded-xl border border-[#e4e7ea] bg-white p-3 text-left transition hover:border-[#fbe2d0]"
                >
                  <MeetingPerson meeting={meeting} mentorTitle={mentorTitle} />
                  {summary ? (
                    <p className="text-sm leading-5 text-[#676e78]">
                      {summary}
                    </p>
                  ) : null}
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <MeetingFiles files={files} onOpen={onOpenFile} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MeetingWhen meeting={meeting} timing={timing} />
                    <TimingBadge timing={timing} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
