import { UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { activeWorkspaceOf } from "@/lib/workspaces";

export type RoleWorkspace = {
  homeHref: string;
  profileHref: string;
  /** Where "Kişisel bilgileri düzenle" in Hesap ayarları leads; staff have no personal page. */
  personalInfoHref: string | null;
  notificationsHref: string;
  showNotificationBadge: boolean;
  usesRoleSubtitle: boolean;
};

const STUDENT_WORKSPACE: RoleWorkspace = {
  homeHref: "/student",
  profileHref: "/student",
  personalInfoHref: "/student",
  notificationsHref: "/student",
  showNotificationBadge: true,
  usesRoleSubtitle: false,
};

export function roleWorkspace(role?: UserRole | null): RoleWorkspace {
  switch (role) {
    case UserRole.Admin:
      return {
        homeHref: "/admin",
        profileHref: "/admin",
        personalInfoHref: null,
        notificationsHref: "/admin",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    case UserRole.Coordinator:
      return {
        homeHref: "/coordinator",
        profileHref: "/coordinator",
        personalInfoHref: null,
        notificationsHref: "/coordinator",
        showNotificationBadge: false,
        usesRoleSubtitle: true,
      };
    case UserRole.Academician:
      return {
        homeHref: "/academician",
        profileHref: "/academician",
        personalInfoHref: "/academician",
        notificationsHref: "/academician",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    case UserRole.Mentor:
      return {
        homeHref: "/mentor-dashboard",
        profileHref: "/mentor-profile",
        personalInfoHref: "/mentor-profile",
        notificationsHref: "/mentor-dashboard#notifications",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    default:
      return {
        homeHref: "/dashboard",
        profileHref: "/profile/personal",
        personalInfoHref: "/profile/personal",
        notificationsHref: "/dashboard#notifications",
        showNotificationBadge: true,
        usesRoleSubtitle: false,
      };
  }
}

const ROLE_OF_WORKSPACE: Record<Workspace, UserRole> = {
  [Workspace.Admin]: UserRole.Admin,
  [Workspace.Coordinator]: UserRole.Coordinator,
  [Workspace.OdtuAcademician]: UserRole.Academician,
  [Workspace.OdtuStudent]: UserRole.Mentee,
  [Workspace.GirisimMentor]: UserRole.Mentor,
  [Workspace.GirisimMentee]: UserRole.Mentee,
};

/** The links of the workspace the account is in (see lib/workspaces.ts). */
export function workspaceForSession(session: AppSession | null) {
  const active = session ? activeWorkspaceOf(session) : null;
  if (active === Workspace.OdtuStudent) return STUDENT_WORKSPACE;
  return roleWorkspace(active ? ROLE_OF_WORKSPACE[active] : session?.role);
}
