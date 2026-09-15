"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { ActiveMentorships } from "@/components/mentee-home/active-mentorships";
import { MeetingNotes } from "@/components/mentee-home/meeting-notes";
import { NextMeetingHero } from "@/components/mentee-home/next-meeting-hero";
import { QuickActions } from "@/components/mentee-home/quick-actions";
import { SentRequests } from "@/components/mentee-home/sent-requests";
import { TaskList } from "@/components/mentee-home/task-list";
import { UpcomingMeetings } from "@/components/mentee-home/upcoming-meetings";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AppArea } from "@/types/app-area";

export default function DashboardPage() {
  const data = useDashboardData();
  return (
    <AppShell active={AppArea.Home} menteeHome>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 pb-[72px] pt-3 sm:px-8">
        <h1 className="text-[28px] font-semibold leading-[41px] text-[#22262b]">
          {data.displayName
            ? `${data.greeting}, ${data.displayName}`
            : data.greeting}
        </h1>
        {data.isFallback && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Veriler yüklenemedi. Daha sonra yeniden dene.
          </p>
        )}
        <NextMeetingHero meeting={data.nextMeeting} loading={data.isLoading} />
        <QuickActions />
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            <TaskList
              tasks={data.homeTasks}
              loading={data.isLoading || data.isLoadingActionItems}
            />
            <UpcomingMeetings
              meetings={data.otherUpcomingMeetings}
              requestsById={data.requestsById}
              loading={data.isLoading}
            />
            <MeetingNotes
              meetings={data.noteMeetings}
              totalCount={data.heldMeetingCount}
              openTodoCounts={data.openTodoCounts}
              requestsById={data.requestsById}
              loading={data.isLoading}
            />
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <SentRequests
              requests={data.sentRequests}
              loading={data.isLoading}
            />
            <ActiveMentorships
              requests={data.activeRequests}
              openActionCountByRequest={data.openActionCountByRequest}
              nextMeetingByRequest={data.nextMeetingByRequest}
              loading={data.isLoading}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
