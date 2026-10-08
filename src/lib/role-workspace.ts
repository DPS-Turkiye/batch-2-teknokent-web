import { UserRole, type AppSession } from "@/interfaces/session";

export type RoleWorkspace = {
  homeHref: string;
  profileHref: string;
  /** Where "Kişisel bilgileri düzenle" in Hesap ayarları leads; staff have no personal page. */
  personalInfoHref: string | null;
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
        personalInfoHref: null,
        notificationsHref: "/admin",
        roleLabel: "Admin",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    case UserRole.Coordinator:
      return {
        homeHref: "/coordinator",
        profileHref: "/coordinator",
        personalInfoHref: null,
        notificationsHref: "/coordinator",
        roleLabel: "Koordinatör",
        showNotificationBadge: false,
        usesRoleSubtitle: true,
      };
    case UserRole.Mentor:
      return {
        homeHref: "/mentor-dashboard",
        profileHref: "/mentor-profile",
        personalInfoHref: "/mentor-profile",
        notificationsHref: "/mentor-dashboard#notifications",
        roleLabel: "Mentor",
        showNotificationBadge: true,
        usesRoleSubtitle: true,
      };
    default:
      return {
        homeHref: "/dashboard",
        profileHref: "/profile/personal",
        personalInfoHref: "/profile/personal",
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
