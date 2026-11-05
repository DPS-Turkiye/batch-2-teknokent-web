import { UserAccountStatus } from "@/interfaces/session";

/** Where a mentee stands with their startup. */
export enum StartupAccess {
  None = "NONE",
  Pending = "PENDING",
  Rejected = "REJECTED",
  Ready = "READY",
}

/** Pages that work only once the startup is approved. */
const NEEDS_APPROVED_STARTUP = [
  "/dashboard",
  "/mentorships",
  "/calendar",
  "/messages",
  "/notes",
  "/mentor-request",
  "/workspace",
  "/assistant",
  "/startup/meetings",
  "/startup/process",
];

/** The startup's own pages stay open while it waits, so its founder can fix it and bring the team in. */
const NEEDS_A_STARTUP = ["/startup/team", "/startup/files"];

export function startupAccessOf(
  organizationId: string | undefined,
  approvalStatus: UserAccountStatus | undefined,
) {
  if (!organizationId) return StartupAccess.None;
  if (approvalStatus === UserAccountStatus.Pending) {
    return StartupAccess.Pending;
  }
  if (approvalStatus === UserAccountStatus.Rejected) {
    return StartupAccess.Rejected;
  }
  return StartupAccess.Ready;
}

function isUnder(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** The empty state to show instead of the page, or null when the page can open. */
export function startupGate(pathname: string, access: StartupAccess) {
  if (access === StartupAccess.Ready) return null;
  if (isUnder(pathname, NEEDS_APPROVED_STARTUP)) return access;
  if (access === StartupAccess.None && isUnder(pathname, NEEDS_A_STARTUP)) {
    return access;
  }
  return null;
}
