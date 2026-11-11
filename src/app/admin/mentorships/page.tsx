"use client";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import { MentorshipTab } from "@/types/admin-mentorships";

export default function AdminMentorshipsPage() {
  return <MentorshipsView tab={MentorshipTab.Overview} />;
}
