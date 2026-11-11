"use client";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import { MentorshipTab } from "@/types/admin-mentorships";

export default function AdminInterventionsPage() {
  return <MentorshipsView tab={MentorshipTab.Interventions} />;
}
