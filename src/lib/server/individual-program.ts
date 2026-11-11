import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";

import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchOrganizationPrograms } from "@/lib/api/programs";
import { currentOrganizationProgram } from "@/lib/organization-programs";
import { hasPermission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import { STUDENT_PROJECT_HREF } from "@/lib/startup-tabs";

const currentProgramIsIndividual = cache(async (userId: string) => {
  try {
    const response = await fetchOrganizationPrograms(userId);
    if (response.status !== 200) return false;
    return (
      currentOrganizationProgram(response.data)?.individualMentees ?? false
    );
  } catch {
    return false;
  }
});

/** Server-side twin of useIndividualProgram; a backend failure counts as not individual. */
export async function isIndividualMentee(session: AppSession | null) {
  if (
    !session ||
    !hasPermission(session, UserRole.Mentee) ||
    !session.organizationId
  ) {
    return false;
  }
  return currentProgramIsIndividual(session.userId);
}

/** Students of an individual program have no startup profile or team pages; send them to Projem. */
export async function redirectIndividualMentee() {
  if (await isIndividualMentee(await getSessionUser())) {
    redirect(STUDENT_PROJECT_HREF);
  }
}
