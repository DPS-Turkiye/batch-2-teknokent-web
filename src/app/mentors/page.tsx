import { AppShell } from "@/components/hoc/app-shell";
import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { loadMentors } from "@/lib/mentors";
import { AppArea } from "@/types/app-area";

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
  const { mentors, error } = await loadMentors();

  return (
    <AppShell active={AppArea.Mentors}>
      <MentorsDirectory mentors={mentors} error={error} />
    </AppShell>
  );
}
