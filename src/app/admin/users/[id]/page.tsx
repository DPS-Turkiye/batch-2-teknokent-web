import { connection } from "next/server";

import { ChangeFounderSection } from "@/components/admin/change-founder-section";
import { DeleteUserSection } from "@/components/admin/delete-user-section";
import { MoveMemberSection } from "@/components/admin/move-member-section";
import { PersonSummaryView } from "@/components/people/person-summary-view";
import {
  offersFounderChange,
  offersTeamMove,
  offersUserDeletion,
} from "@/lib/edition-screens";
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
      {offersTeamMove(appEdition()) ? <MoveMemberSection userId={id} /> : null}
      {offersFounderChange(appEdition()) ? (
        <ChangeFounderSection userId={id} />
      ) : null}
      {offersUserDeletion(appEdition()) ? (
        <DeleteUserSection userId={id} />
      ) : null}
    </div>
  );
}
