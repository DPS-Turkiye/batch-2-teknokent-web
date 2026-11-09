import { ProgramApprovalsView } from "@/components/coordinator/program-approvals-view";

export default async function AdminProgramApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramApprovalsView programId={id} />;
}
