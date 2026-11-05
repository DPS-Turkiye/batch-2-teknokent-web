import { redirect } from "next/navigation";
import { StartupProfileToolsView } from "@/components/startup/startup-profile-tools-view";
import { UserRole } from "@/interfaces/session";
import { roleWorkspace } from "@/lib/role-workspace";
import { loginPathFor } from "@/lib/public-paths";
import { getSessionUser } from "@/lib/session";

export default async function StartupProfileToolsPage() {
  const session = await getSessionUser();
  if (!session) redirect(loginPathFor("/startup/profile-tools"));
  if (session.role !== UserRole.Mentee)
    redirect(roleWorkspace(session.role).homeHref);
  if (!session.organizationId) redirect("/profile/personal");
  return <StartupProfileToolsView />;
}
