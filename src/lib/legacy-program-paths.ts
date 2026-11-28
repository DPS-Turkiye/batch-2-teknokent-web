import { UserRole } from "@/interfaces/session";
import { roleWorkspace } from "@/lib/role-workspace";

/** Where the old coordinator page /programs (still linked from backend notifications) now lives for `role`. */
export function legacyProgramsHref(role: UserRole) {
  if (role === UserRole.Coordinator) return "/coordinator/programs";
  if (role === UserRole.Admin) return "/admin/programs";
  return roleWorkspace(role).homeHref;
}

/** An admin manages a program from the admin screens; everyone else stays on /programs/{id}. */
export function legacyProgramDetailHref(role: UserRole, programId: string) {
  return role === UserRole.Admin
    ? `/admin/programs/${encodeURIComponent(programId)}`
    : null;
}
