"use client";

import { useParams } from "next/navigation";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingEvaluationView } from "@/components/mentor-evaluation/meeting-evaluation-view";
import { AppArea } from "@/types/app-area";

export default function MentorMeetingEvaluationPage() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell active={AppArea.Mentorships} mentorHome>
      <MeetingEvaluationView meetingId={params.id} />
    </AppShell>
  );
}
