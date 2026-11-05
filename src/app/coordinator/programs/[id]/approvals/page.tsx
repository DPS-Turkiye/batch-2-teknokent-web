import { ProgramApprovalsView } from "@/components/coordinator/program-approvals-view";

export default async function CoordinatorProgramApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramApprovalsView programId={id} />;
}
