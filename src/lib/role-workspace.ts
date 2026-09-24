import { UserRole, type AppSession } from "@/interfaces/session";

export type RoleWorkspace = {
  homeHref: string;
  profileHref: string;
  notificationsHref: string;
  roleLabel: string;
  showNotificationBadge: boolean;
  usesRoleSubtitle: boolean;
};

export function roleWorkspace(role?: UserRole | null): RoleWorkspace {
  switch (role) {
    case UserRole.Admin:
      return {
        homeHref: "/admin",
        profileHref: "/admin",
        notificationsHref: "/admin",
        roleLabel: "Admin",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    case UserRole.Coordinator:
      return {
        homeHref: "/coordinator",
        profileHref: "/coordinator",
        notificationsHref: "/coordinator",
        roleLabel: "Koordinatör",
        showNotificationBadge: false,
        usesRoleSubtitle: true,
      };
    case UserRole.Mentor:
      return {
        homeHref: "/mentor-dashboard",
        profileHref: "/mentor-profile",
        notificationsHref: "/mentor-dashboard#notifications",
        roleLabel: "Mentor",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    default:
      return {
        homeHref: "/dashboard",
        profileHref: "/profile/personal",
        notificationsHref: "/dashboard#notifications",
        roleLabel: "Girişim Ekibi",
        showNotificationBadge: true,
        usesRoleSubtitle: false,
      };
  }
}

export function workspaceForSession(session: AppSession | null) {
  const workspace = roleWorkspace(session?.role);
  return {
    ...workspace,
    title: workspace.usesRoleSubtitle
      ? (session?.fullName ?? workspace.roleLabel)
      : (session?.organizationName ?? ""),
    displayOrganization: workspace.usesRoleSubtitle
      ? workspace.roleLabel
      : (session?.organizationName ?? ""),
  };
}
