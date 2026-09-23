import { redirect } from "next/navigation";

import { AppShell } from "@/components/hoc/app-shell";
import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { UserRole } from "@/interfaces/session";
import { loadMentors } from "@/lib/mentors";
import { getSessionUser } from "@/lib/session";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export const dynamic = "force-dynamic";

// Mentees find mentors in Mentorluklarım's mentor pool; the page stays for
// coordinators until they get their own mentor view.
export default async function MentorsPage() {
  const session = await getSessionUser();
  if (session?.role === UserRole.Mentee) {
    redirect(`/mentorships?tab=${MentorshipWorkspaceTab.MentorPool}`);
  }

  const { mentors, error } = await loadMentors();

  return (
    <AppShell active={AppArea.Mentors}>
      <MentorsDirectory mentors={mentors} error={error} />
    </AppShell>
  );
}
