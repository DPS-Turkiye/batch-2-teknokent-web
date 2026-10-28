"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import type { UserRole } from "@/interfaces/session";
import { roleWorkspace } from "@/lib/role-workspace";

/**
 * Sends anyone whose role is not allowed to their own home. `allowed` stays false while the
 * session loads, so role-only queries can wait on it.
 */
export function useRoleGate(allowedRoles: readonly UserRole[]) {
  const session = useAppSession();
  const { isLoading } = useSession();
  const router = useRouter();
  const allowed = session != null && allowedRoles.includes(session.role);

  useEffect(() => {
    if (isLoading || !session) return;
    if (!allowedRoles.includes(session.role)) {
      router.replace(roleWorkspace(session.role).homeHref);
    }
  }, [allowedRoles, isLoading, router, session]);

  return { allowed, isLoading };
}
