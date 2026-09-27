import { ProgramMentorsView } from "@/components/coordinator/program-mentors-view";

export default async function CoordinatorProgramMentorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramMentorsView programId={id} />;
}
