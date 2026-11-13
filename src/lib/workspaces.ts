import { AccountType } from "@/interfaces/account-type";
import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { hasPermission } from "@/lib/permissions";

type WorkspaceHolder = Pick<
  AppSession,
  | "role"
  | "permissions"
  | "institutionKinds"
  | "organizationId"
  | "individualMentee"
  | "activeWorkspace"
  | "personalOrganization"
  | "edition"
>;

/** The ODTÜ workspaces live only in the ODTÜ deployment. */
const ODTU_WORKSPACES: ReadonlySet<Workspace> = new Set([
  Workspace.OdtuStudent,
  Workspace.OdtuAcademician,
]);

/** Also the order a first sign-in picks from: staff first, an academician before the student they also are. */
const ORDER = Object.values(Workspace);

/**
 * The workspaces this account can open. On an ODTÜ account MENTOR is peer mentoring, which lives inside the student
 * workspace; a Girişim workspace appears only for a startup team the person also belongs to. The Teknokent
 * deployment opens no ODTÜ workspace, whatever the account holds.
 */
export function workspacesOf(session: WorkspaceHolder): Workspace[] {
  const odtu = Boolean(session.institutionKinds?.length);
  const held = new Set<Workspace>();
  if (hasPermission(session, UserRole.Admin)) held.add(Workspace.Admin);
  if (hasPermission(session, UserRole.Coordinator)) {
    held.add(Workspace.Coordinator);
  }
  if (hasPermission(session, UserRole.Academician)) {
    held.add(Workspace.OdtuAcademician);
  }
  if (
    odtu &&
    session.institutionKinds?.includes(IdentityKind.Student) &&
    hasPermission(session, UserRole.Mentee)
  ) {
    held.add(Workspace.OdtuStudent);
  }
  if (!odtu && hasPermission(session, UserRole.Mentor)) {
    held.add(Workspace.GirisimMentor);
  }
  if (
    hasPermission(session, UserRole.Mentee) &&
    (!odtu ||
      (session.organizationId &&
        !session.individualMentee &&
        !session.personalOrganization))
  ) {
    held.add(Workspace.GirisimMentee);
  }
  const edition = session.edition ?? Edition.Teknokent;
  return ORDER.filter(
    (workspace) =>
      held.has(workspace) &&
      (edition === Edition.Odtu || !ODTU_WORKSPACES.has(workspace)),
  );
}

/** The chosen workspace while the account can still open it, else the first one it can. */
export function activeWorkspaceOf(session: WorkspaceHolder): Workspace | null {
  const available = workspacesOf(session);
  if (session.activeWorkspace && available.includes(session.activeWorkspace)) {
    return session.activeWorkspace;
  }
  return available[0] ?? null;
}

export function isWorkspace(value: unknown): value is Workspace {
  return (ORDER as unknown[]).includes(value);
}

export function accountTypeOfWorkspace(workspace: Workspace | null) {
  return workspace === Workspace.OdtuStudent ||
    workspace === Workspace.OdtuAcademician
    ? AccountType.Odtu
    : AccountType.Teknokent;
}
