import "server-only";
import { UserRole } from "@/interfaces/session";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function requireProfileAnalysisSession() {
  const session = await getSessionUser();
  if (!session) throw new SessionRequiredError();
  return session.role === UserRole.Mentee && session.organizationId
    ? session
    : null;
}
