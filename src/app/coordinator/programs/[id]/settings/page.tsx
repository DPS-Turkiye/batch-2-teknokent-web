import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";

export default async function CoordinatorProgramSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramSettingsView programId={id} />;
}
