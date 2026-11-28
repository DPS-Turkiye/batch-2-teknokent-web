"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { currentOrganizationProgram } from "@/lib/organization-programs";
import {
  profileDestination,
  startupPageRedirect,
} from "@/lib/startup-page-gate";

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
  const guess = session.individualMentee;
  return {
    individual: guess ?? false,
    isLoading: guess === undefined && programs.isLoading,
    programId: null,
  };
}

/** The session and whether its program is individual, once both are known; null until then. */
function useSettledIndividual() {
  const { session, isLoading } = useSession();
  const program = useIndividualProgram();
  const pending = isLoading || (session !== null && program.isLoading);
  return pending ? null : { session, individual: program.individual };
}

/**
 * Sends someone a startup page is not for elsewhere (see startupPageRedirect), once the session and their program
 * are known. True when the page may render.
 */
export function useStartupPageGate(options: { strict: boolean; path: string }) {
  const router = useRouter();
  const settled = useSettledIndividual();
  const destination = settled
    ? startupPageRedirect({ ...settled, ...options })
    : null;
  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);
  return settled !== null && destination === null;
}

/** /profile: sends the person on to their own profile once the session and their program are known. */
export function useProfileRedirect(web: boolean) {
  const router = useRouter();
  const settled = useSettledIndividual();
  const destination = settled ? profileDestination({ ...settled, web }) : null;
  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);
}
