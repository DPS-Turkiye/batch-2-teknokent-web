import { DeleteUserSection } from "@/components/admin/delete-user-section";
import { PersonSummaryView } from "@/components/people/person-summary-view";

export default async function AdminPersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PersonSummaryView userId={id} />
      <DeleteUserSection userId={id} />
    </div>
  );
}
