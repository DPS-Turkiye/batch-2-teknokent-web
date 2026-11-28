"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  legacyProgramDetailHref,
  legacyProgramsHref,
} from "@/lib/legacy-program-paths";

/**
 * Sends the signed-in person from an old program link to its current screen. `waiting` holds the page back until
 * the session is known and while it is leaving, so an admin never sees the page they are being moved off. A
 * signed-out visitor is sent to log in by the session provider.
 */
function useRedirect(target: string | null, isLoading: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (target) router.replace(target);
  }, [router, target]);
  return { waiting: isLoading || target !== null };
}

export function useLegacyProgramsRedirect() {
  const { session, isLoading } = useSession();
  return useRedirect(
    session ? legacyProgramsHref(session.role) : null,
    isLoading,
  );
}

export function useLegacyProgramDetailRedirect() {
  const { session, isLoading } = useSession();
  const { id } = useParams<{ id: string }>();
  return useRedirect(
    session ? legacyProgramDetailHref(session.role, id) : null,
    isLoading,
  );
}
