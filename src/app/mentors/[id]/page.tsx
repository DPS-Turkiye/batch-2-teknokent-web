"use client";

import { useParams } from "next/navigation";

import { AppShell } from "@/components/hoc/app-shell";
import { MentorDetailView } from "@/components/mentors/mentor-detail-view";
import { MentorUnavailable } from "@/components/mentors/mentor-unavailable";
import { useAppSession } from "@/components/providers/session-provider";
import { useMentorPage, useStartupContext } from "@/hooks/use-mentor-pages";
import type { StartupContext } from "@/interfaces/startup";
import { AppArea } from "@/types/app-area";

const NO_STARTUP: StartupContext = {
  organizationId: "",
  name: "",
  summary: "",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = useAppSession();
  const { isLoading, page, slots } = useMentorPage(id);
  const startup = useStartupContext(session?.organizationId);

  if (isLoading || startup.isLoading) {
    return (
      <AppShell active={AppArea.Mentorships} menteeHome>
        {null}
      </AppShell>
    );
  }
  if (!page) {
    return (
      <AppShell active={AppArea.Mentorships} menteeHome>
        <MentorUnavailable />
      </AppShell>
    );
  }
  return (
    <AppShell active={AppArea.Mentorships} menteeHome>
      <MentorDetailView
        mentor={page.mentor}
        viewOnlyPrograms={page.viewOnlyPrograms}
        slots={slots}
        startup={startup.startup ?? NO_STARTUP}
      />
    </AppShell>
  );
}
