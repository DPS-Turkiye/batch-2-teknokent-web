"use client";

import {
  MeetingPerson,
  MeetingWhen,
  TimingBadge,
} from "@/components/startup/meeting-card-parts";
import {
  MeetingLayout,
  type MeetingDetails,
} from "@/hooks/use-startup-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MeetingTiming,
  meetingTitle,
  type MeetingTopic,
} from "@/lib/startup-meetings";

export function MeetingTopicGrid({
  details,
  kind = "topic",
  layout,
  onOpenTopic,
  topics,
}: {
  details: (meeting: MeetingItem) => MeetingDetails;
  kind?: "topic" | "mentor";
  layout: MeetingLayout;
  onOpenTopic: (topicKey: string) => void;
  topics: MeetingTopic[];
}) {
  return (
    <ul
      className={`grid gap-5 ${layout === MeetingLayout.Grid ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}
    >
      {topics.map((topic) => {
        const featured = Boolean(topic.upcoming);
        const meeting = topic.upcoming ?? topic.latest;
        const { mentorTitle, summary } = details(meeting);
        const timing = featured ? MeetingTiming.Upcoming : MeetingTiming.Held;
        return (
          <li key={topic.key} className="relative pt-2.5">
            {!featured && topic.meetings.length > 1 ? (
              <>
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-3 right-0 rounded-[21px] bg-[#fff4ec]"
                />
                <span
                  aria-hidden
                  className="absolute bottom-0 left-1.5 right-1.5 top-1 rounded-[21px] bg-[#fff4ec]"
                />
              </>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenTopic(topic.key)}
              aria-label={`${topic.title} notlarını aç`}
              className={`relative w-full space-y-2.5 rounded-[21px] p-5 text-left transition ${featured ? "bg-[#ffe3d5]" : "border border-[#e4e7ea] bg-white hover:border-[#fbe2d0]"}`}
            >
              <h3
                className={`text-lg leading-6 ${featured ? "text-[#f97316]" : "text-[#676e78]"}`}
              >
                {topic.title}
              </h3>
              <div
                className={`space-y-2.5 rounded-[10px] bg-white p-2.5 ${featured ? "" : "border border-[#e4e7ea]"}`}
              >
                {kind === "mentor" ? (
                  <p className="text-sm leading-5 text-[#676e78]">
                    {meetingTitle(meeting)}
                  </p>
                ) : (
                  <MeetingPerson meeting={meeting} mentorTitle={mentorTitle} />
                )}
                {summary ? (
                  <p className="text-xs leading-[18px] text-[#676e78]">
                    {summary}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MeetingWhen meeting={meeting} timing={timing} />
                  <TimingBadge timing={timing} />
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
