"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { currentOrganizationProgram } from "@/lib/organization-programs";

/**
 * Whether the signed-in mentee's current program takes students as teams of one (İŞKUR-style), so its screens
 * use student wording and hide the startup pages. Other roles, and mentees without a team, are never individual.
 * The programs query decides; until it answers, the flag saved in the session at sign-in stands in, so the first
 * render does not flash the wrong wording. `programId` is the current program the answer is about.
 */
export function useIndividualProgram() {
  const session = useAppSession();
  const enabled =
    session?.role === UserRole.Mentee && Boolean(session.organizationId);
  const programs = useOrganizationPrograms({ enabled });
  if (!session) return { individual: false, isLoading: true, programId: null };
  if (!enabled) return { individual: false, isLoading: false, programId: null };
  const current = currentOrganizationProgram(programs.data);
  if (programs.data) {
    return {
      individual: current?.individualMentees ?? false,
      isLoading: false,
      programId: current?.id ?? null,
    };
  }
  const guess = session?.individualMentee;
  return {
    individual: guess ?? false,
    isLoading: guess === undefined && programs.isLoading,
    programId: null,
  };
}
