import { ProgramReportView } from "@/components/coordinator/program-report-view";

export default async function CoordinatorProgramReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramReportView programId={id} />;
}
