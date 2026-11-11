"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import {
  MeetingFiles,
  MeetingPerson,
  MeetingWhen,
  TimingBadge,
} from "@/components/startup/meeting-card-parts";
import type { MeetingDetails } from "@/hooks/use-startup-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  meetingTiming,
  type MeetingMonth,
  type MeetingYear,
} from "@/lib/startup-meetings";

export function MeetingTimeline({
  details,
  expandedMonthKey,
  expandedYear,
  onOpenFile,
  onOpenMeeting,
  onToggleMonth,
  onToggleYear,
  years,
}: {
  details: (meeting: MeetingItem) => MeetingDetails;
  expandedMonthKey: string | null;
  expandedYear: number | null;
  onOpenFile: (documentId: string) => void;
  onOpenMeeting: (meetingId: string) => void;
  onToggleMonth: (key: string) => void;
  onToggleYear: (year: number) => void;
  years: MeetingYear[];
}) {
  const t = useTranslations("startupMeetings");
  const countLabel = (month: MeetingMonth) =>
    t("count", { count: month.meetings.length });
  return (
    <div className="flex flex-col gap-7">
      {years.map((year) => {
        if (year.year !== expandedYear) {
          return (
            <button
              key={year.year}
              type="button"
              aria-expanded={false}
              onClick={() => onToggleYear(year.year)}
              className="w-full pt-2 pr-2"
            >
              <span className="flex w-full items-center justify-center rounded-[24px] border border-[#e4e7ea] bg-white px-6 py-9 text-xl text-[#95cdff] shadow-[6px_-6px_0_#c9e1f1,12px_-12px_0_#9bc7e4]">
                {year.year}
              </span>
            </button>
          );
        }

        const expanded = year.months.find(
          (month) => month.key === expandedMonthKey,
        );
        const collapsed = year.months.filter((month) => month !== expanded);
        return (
          <section
            key={year.year}
            aria-label={t("yearMeetings", { year: year.year })}
            className="flex flex-col gap-6"
          >
            {expanded ? (
              <section
                aria-label={`${expanded.label} ${year.year}`}
                className="space-y-3 rounded-[24px] bg-[#f5faff] p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl leading-7 text-[#007ecc]">
                    {expanded.label}
                  </h3>
                  <button
                    type="button"
                    aria-expanded
                    onClick={() => onToggleMonth(expanded.key)}
                    className="flex items-center gap-2 text-sm text-[#007ecc] underline"
                  >
                    {countLabel(expanded)}
                    <Image
                      src="/startup/expand-up.svg"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {expanded.meetings.map((meeting) => {
                    const { files, mentorTitle, summary } = details(meeting);
                    const timing = meetingTiming(meeting);
                    return (
                      <li
                        key={meeting.id}
                        className="space-y-3 rounded-xl bg-white p-3"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenMeeting(meeting.id)}
                          className="block w-full space-y-3 text-left"
                        >
                          <MeetingPerson
                            meeting={meeting}
                            mentorTitle={mentorTitle}
                          />
                          {summary ? (
                            <p className="text-sm leading-5 text-[#676e78]">
                              {summary}
                            </p>
                          ) : null}
                        </button>
                        <MeetingFiles files={files} onOpen={onOpenFile} />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <MeetingWhen meeting={meeting} timing={timing} />
                          <TimingBadge timing={timing} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
            {collapsed.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {collapsed.map((month) => (
                  <li key={month.key}>
                    <button
                      type="button"
                      aria-expanded={false}
                      onClick={() => onToggleMonth(month.key)}
                      className="flex w-full items-center justify-center gap-7 rounded-[24px] border border-[#e4e7ea] bg-white px-3 py-9 text-left shadow-[6px_-6px_0_#c9e1f1]"
                    >
                      <span className="text-xl text-[#95cdff]">
                        {month.label}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-[#95cdff] underline">
                        {countLabel(month)}
                        <Image
                          src="/startup/expand-muted.svg"
                          alt=""
                          width={24}
                          height={24}
                          className="rotate-180"
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
