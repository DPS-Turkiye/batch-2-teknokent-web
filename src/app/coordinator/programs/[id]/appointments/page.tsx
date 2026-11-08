import { ProgramTypeTabView } from "@/components/coordinator/program-type-tab-view";
import { ProgramTab } from "@/lib/coordinator-program-detail";

export default async function CoordinatorProgramAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramTypeTabView programId={id} tab={ProgramTab.Appointments} />;
}
