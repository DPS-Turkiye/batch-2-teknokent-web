"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import type { UserRole } from "@/interfaces/session";
import { hasAnyPermission } from "@/lib/permissions";
import { roleWorkspace } from "@/lib/role-workspace";

/**
 * Sends anyone holding none of the allowed permissions to their own home. `allowed` stays false while the
 * session loads, so role-only queries can wait on it.
 */
export function useRoleGate(allowedRoles: readonly UserRole[]) {
  const session = useAppSession();
  const { isLoading } = useSession();
  const router = useRouter();
  const allowed = hasAnyPermission(session, allowedRoles);

  useEffect(() => {
    if (isLoading || !session) return;
    if (!hasAnyPermission(session, allowedRoles)) {
      router.replace(roleWorkspace(session.role).homeHref);
    }
  }, [allowedRoles, isLoading, router, session]);

  return { allowed, isLoading };
}
