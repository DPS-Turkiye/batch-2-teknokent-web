import { UserRole, type AppSession } from "@/interfaces/session";

export type RoleWorkspace = {
  homeHref: string;
  profileHref: string;
  /** Where "Kişisel bilgileri düzenle" in Hesap ayarları leads; staff have no personal page. */
  personalInfoHref: string | null;
  notificationsHref: string;
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

export function workspaceForSession(session: AppSession | null) {
  return roleWorkspace(session?.role);
}
