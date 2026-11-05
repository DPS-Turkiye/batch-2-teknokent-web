import { ProgramTeamsView } from "@/components/coordinator/program-teams-view";

export default async function AdminProgramTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramTeamsView programId={id} />;
}
