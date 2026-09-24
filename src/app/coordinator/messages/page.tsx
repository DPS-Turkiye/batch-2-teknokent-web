import { CoordinatorMessagesView } from "@/components/coordinator/messages-view";

type Search = {
  conversation?: string;
  program?: string;
  mentor?: string;
  team?: string;
};

/** `?program=&mentor=` (or `&team=`) opens that thread, creating it the first time. */
export default async function CoordinatorMessagesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { conversation, program, mentor, team } = await searchParams;
  const start =
    program && (mentor || team)
      ? {
          programId: program,
          mentorId: mentor ?? null,
          organizationId: mentor ? null : (team ?? null),
        }
      : null;
  return (
    <CoordinatorMessagesView
      link={{ conversationId: conversation ?? null, start }}
    />
  );
}
