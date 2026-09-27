import { ProgramMatchingView } from "@/components/coordinator/program-matching-view";

export default async function CoordinatorProgramMatchingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const [{ id }, { team }] = await Promise.all([params, searchParams]);
  return <ProgramMatchingView programId={id} initialTeamId={team} />;
}
