"use client";

import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { UserRole } from "@/interfaces/session";

const NAV: RoleNavItem[] = [
  {
    href: "/admin",
    label: "home",
    icon: "/admin/nav-home.svg",
    match: (path) => path === "/admin",
  },
  {
    href: "/admin/programs",
    label: "programs",
    icon: "/admin/nav-folder.svg",
    match: (path) => path.startsWith("/admin/programs"),
  },
  {
    href: "/admin/users",
    label: "users",
    icon: "/admin/nav-users.svg",
    match: (path) => path.startsWith("/admin/users"),
  },
  {
    href: "/admin/mentorships",
    label: "mentorships",
    icon: "/admin/nav-lamp.svg",
    match: (path) => path.startsWith("/admin/mentorships"),
  },
  {
    href: "/admin/reporting",
    label: "reporting",
    icon: "/admin/nav-chart.svg",
    match: (path) => path.startsWith("/admin/reporting"),
  },
];

const ADMIN_ONLY = [UserRole.Admin];

export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <RoleFrame
      allowedRoles={ADMIN_ONLY}
      homeHref="/admin"
      menuLabel="adminMenu"
      nav={NAV}
    >
      {children}
    </RoleFrame>
  );
}
