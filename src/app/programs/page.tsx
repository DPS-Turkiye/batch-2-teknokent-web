import { redirect } from "next/navigation";

import { UserRole } from "@/interfaces/session";
import { loginPathFor } from "@/lib/public-paths";
import { roleWorkspace } from "@/lib/role-workspace";
import { getSessionUser } from "@/lib/session";

// The old coordinator page; backend notifications still link here.
export default async function ProgramsPage() {
  const session = await getSessionUser();
  if (!session) redirect(loginPathFor("/programs"));
  if (session.role === UserRole.Coordinator) redirect("/coordinator/programs");
  if (session.role === UserRole.Admin) redirect("/admin/programs");
  redirect(roleWorkspace(session.role).homeHref);
}
