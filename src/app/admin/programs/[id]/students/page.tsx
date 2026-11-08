import { PeerParticipantsView } from "@/components/coordinator/peer-participants-view";
import { ProgramTab } from "@/lib/coordinator-program-detail";

export default async function AdminProgramStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PeerParticipantsView programId={id} tab={ProgramTab.Students} />;
}
