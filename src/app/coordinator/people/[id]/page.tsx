import { PersonSummaryView } from "@/components/people/person-summary-view";

export default async function CoordinatorPersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonSummaryView userId={id} />;
}
