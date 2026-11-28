import type { Edition } from "@/interfaces/edition";
import {
  UserRole,
  type AppSession,
  type BackendUser,
} from "@/interfaces/session";
import type { Workspace } from "@/interfaces/workspace";
import { permissionsOf } from "@/lib/permissions";
import { workspacesOf } from "@/lib/workspaces";

export const DEFAULT_JOB_TITLE: Partial<Record<UserRole, string>> = {
  [UserRole.Mentee]: "Mentee",
  [UserRole.Mentor]: "Mentor",
  [UserRole.Admin]: "Admin",
  [UserRole.Coordinator]: "Koordinatör",
  [UserRole.Academician]: "Akademisyen",
};

/**
 * The session for an account as /api/auth/me describes it, under `edition` (this deployment's, never the one a
 * stored session claims); null for a role that has no workspace.
 */
export function toSession(
  user: BackendUser,
  edition: Edition,
): AppSession | null {
  const jobTitle = DEFAULT_JOB_TITLE[user.role];
  if (!jobTitle) return null;
  const session: AppSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    jobTitle: user.jobTitle ?? jobTitle,
    role: user.role,
    permissions: permissionsOf(user),
    edition,
  };
  if (user.institutionKinds?.length) {
    session.institutionKinds = user.institutionKinds;
  }
  // Whoever is mentored carries their team, a research assistant (primary role ACADEMICIAN) included. Someone who
  // signed up without a startup has none until they join or create one on /startup.
  if (session.permissions?.includes(UserRole.Mentee)) {
    session.organizationId = user.organizationId ?? undefined;
    session.organizationName = user.organizationName ?? undefined;
    session.individualMentee = user.individualMentee;
    if (user.personalOrganization) session.personalOrganization = true;
  }
  return session;
}

/**
 * The session with `workspace` open, when the account can open it; null when it cannot. Only what the UI shows
 * changes: every backend call still checks the account's own permissions, so a switch never widens what it may do.
 */
export function withWorkspace(
  session: AppSession,
  workspace: Workspace,
): AppSession | null {
  return workspacesOf(session).includes(workspace)
    ? { ...session, activeWorkspace: workspace }
    : null;
}
