"use client";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import { MentorshipTab } from "@/types/admin-mentorships";

export default function AdminMatchingPage() {
  return <MentorshipsView tab={MentorshipTab.Matching} />;
}
