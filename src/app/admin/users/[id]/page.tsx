import { connection } from "next/server";

import { DeleteUserSection } from "@/components/admin/delete-user-section";
import { PersonSummaryView } from "@/components/people/person-summary-view";
import { offersUserDeletion } from "@/lib/edition-screens";
import { appEdition } from "@/lib/server/edition";

export default async function AdminPersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Read per request: a prerendered page would freeze the edition the build ran with.
  await connection();
  return (
    <div className="space-y-6">
      <PersonSummaryView userId={id} />
      {offersUserDeletion(appEdition()) ? (
        <DeleteUserSection userId={id} />
      ) : null}
    </div>
  );
}
