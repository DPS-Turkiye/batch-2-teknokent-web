"use client";

import { useParams } from "next/navigation";

import { MentorRequestStartupDetail } from "@/components/mentorships/mentor-request-startup-detail";

export default function MentorshipRequestStartupPage() {
  const params = useParams<{ id: string }>();
  return <MentorRequestStartupDetail requestId={params.id} />;
}
