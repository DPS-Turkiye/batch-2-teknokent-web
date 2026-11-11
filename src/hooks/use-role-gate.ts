"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import type { AppSession, UserRole } from "@/interfaces/session";
import type { Workspace } from "@/interfaces/workspace";
import { hasAnyPermission } from "@/lib/permissions";
import { roleWorkspace, workspaceForSession } from "@/lib/role-workspace";
import { workspacesOf } from "@/lib/workspaces";

function canOpen(
  session: AppSession | null,
  allowedRoles: readonly UserRole[],
  workspace: Workspace | undefined,
) {
  if (!session) return false;
  return workspace
    ? workspacesOf(session).includes(workspace)
    : hasAnyPermission(session, allowedRoles);
}

/**
 * Sends anyone who may not open the frame to their own home. A staff frame lists the permissions it
 * needs; an ODTÜ frame names its workspace instead, since being a student or academician is an
 * institutional fact on top of the permission. `allowed` stays false while the session loads, so
 * role-only queries can wait on it.
 */
export function useRoleGate(
  allowedRoles: readonly UserRole[],
  workspace?: Workspace,
) {
  const session = useAppSession();
  const { isLoading } = useSession();
  const router = useRouter();
  const allowed = canOpen(session, allowedRoles, workspace);
  const home = session
    ? workspace
      ? workspaceForSession(session).homeHref
      : roleWorkspace(session.role).homeHref
    : null;

  useEffect(() => {
    if (isLoading || !session || allowed || !home) return;
    router.replace(home);
  }, [allowed, home, isLoading, router, session]);

  return { allowed, isLoading };
}
