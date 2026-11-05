import { redirect } from "next/navigation";

import { ProgramDetailView } from "@/components/programs/program-detail-view";
import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSessionUser(), params]);
  if (session?.role === UserRole.Admin) {
    redirect(`/admin/programs/${encodeURIComponent(id)}`);
  }
  return <ProgramDetailView />;
}
