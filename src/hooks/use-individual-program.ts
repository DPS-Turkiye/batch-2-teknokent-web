"use client";

import { useSession } from "@/components/providers/session-provider";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { currentOrganizationProgram } from "@/lib/organization-programs";

/**
 * Whether the signed-in mentee's current program takes students as teams of one (İŞKUR-style), so its screens
 * use student wording and hide the startup pages. Other roles, and mentees without a team, are never individual.
 */
export function useIndividualProgram() {
  const { session } = useSession();
  const enabled =
    session?.role === UserRole.Mentee && Boolean(session.organizationId);
  const programs = useOrganizationPrograms({ enabled });
  if (!enabled) return { individual: false, isLoading: false };
  return {
    individual:
      currentOrganizationProgram(programs.data)?.individualMentees ?? false,
    isLoading: programs.isLoading,
  };
}
