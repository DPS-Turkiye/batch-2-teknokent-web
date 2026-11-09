import { ProgramAcademicsView } from "@/components/coordinator/program-academics-view";

export default async function AdminProgramAcademicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramAcademicsView programId={id} />;
}
