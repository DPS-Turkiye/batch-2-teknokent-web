import { redirect } from "next/navigation";
import { UserRole } from "@/interfaces/session";
import { webHref } from "@/lib/mobile";
import { loginPathFor } from "@/lib/public-paths";
import { roleWorkspace } from "@/lib/role-workspace";
import { isIndividualMentee } from "@/lib/server/individual-program";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ web?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect(loginPathFor("/profile"));
  // A student of an individual program has no startup profile, so their profile is the personal one.
  const destination =
    session.role === UserRole.Mentee &&
    session.organizationId &&
    !(await isIndividualMentee(session))
      ? "/startup/profile-tools"
      : roleWorkspace(session.role).profileHref;
  const query = await searchParams;
  redirect(query.web === "1" ? webHref(destination) : destination);
}
