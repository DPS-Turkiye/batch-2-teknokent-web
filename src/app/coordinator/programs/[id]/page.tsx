import { ProgramOverviewView } from "@/components/coordinator/program-overview-view";

export default async function CoordinatorProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramOverviewView programId={id} />;
}
