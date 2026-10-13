"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  MeetingPerson,
  MeetingWhen,
} from "@/components/startup/meeting-card-parts";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  meetingNotebookHref,
  meetingTiming,
  meetingTitle,
} from "@/lib/startup-meetings";

export function MeetingMentorNotesStrip({
  meetings,
  mentorTitle,
  openTodos,
}: {
  meetings: MeetingItem[];
  mentorTitle: string | null;
  openTodos: Map<string, number>;
}) {
  const t = useTranslations("notes");
  if (meetings.length === 0) return null;

  return (
    <section aria-label={t("sameMentor")} className="mt-6">
      <ul className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {meetings.map((meeting) => (
          <li key={meeting.id} className="w-[320px] shrink-0 snap-start">
            <Link
              href={meetingNotebookHref(meeting.id)}
              className="block space-y-3 rounded-xl border border-[#e4e7ea] bg-white p-3 hover:border-[#fbe2d0]"
            >
              <h3 className="truncate text-xl leading-7 text-[#858c96]">
                {meetingTitle(meeting, t("untitled"))}
              </h3>
              <MeetingPerson meeting={meeting} mentorTitle={mentorTitle} />
              <div className="flex flex-wrap items-center gap-3">
                <MeetingWhen
                  meeting={meeting}
                  timing={meetingTiming(meeting)}
                  dateOnly
                />
                {openTodos.get(meeting.id) ? (
                  <span className="rounded-full border border-[#f97316] bg-white px-2.5 py-1 text-[11px] font-medium text-[#f97316]">
                    {t("tasksOpen")}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
