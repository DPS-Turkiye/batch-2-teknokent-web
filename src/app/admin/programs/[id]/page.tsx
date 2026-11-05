import { ProgramOverviewView } from "@/components/coordinator/program-overview-view";

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramOverviewView programId={id} />;
}
