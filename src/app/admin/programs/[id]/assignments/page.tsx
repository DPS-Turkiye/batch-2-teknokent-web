import { ProgramAssignmentsView } from "@/components/coordinator/program-assignments-view";

export default async function AdminProgramAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramAssignmentsView programId={id} />;
}
