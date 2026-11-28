"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { useAppSession } from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

// Mentees find mentors in Mentorluklarım's mentor pool; the page stays for
// coordinators until they get their own mentor view.
export default function MentorsPage() {
  const router = useRouter();
  const session = useAppSession();
  const mentee = session?.role === UserRole.Mentee;

  useEffect(() => {
    if (mentee) {
      router.replace(`/mentorships?tab=${MentorshipWorkspaceTab.MentorPool}`);
    }
  }, [mentee, router]);

  if (!session || mentee) return null;
  return (
    <AppShell active={AppArea.Mentors}>
      <MentorsDirectory />
    </AppShell>
  );
}
