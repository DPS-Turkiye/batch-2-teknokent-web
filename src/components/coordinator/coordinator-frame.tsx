"use client";

import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { UserRole } from "@/interfaces/session";

const NAV: RoleNavItem[] = [
  {
    href: "/coordinator",
    label: "Anasayfa",
    icon: "/admin/nav-home.svg",
    match: (path) => path === "/coordinator",
  },
  {
    href: "/coordinator/programs",
    label: "Programlarım",
    icon: "/admin/nav-folder.svg",
    match: (path) => path.startsWith("/coordinator/programs"),
  },
  {
    href: "/coordinator/mentorships",
    label: "Mentorluklar",
    icon: "/admin/nav-lamp.svg",
    match: (path) => path.startsWith("/coordinator/mentorships"),
  },
  {
    href: "/coordinator/calendar",
    label: "Takvim",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith("/coordinator/calendar"),
  },
  {
    href: "/coordinator/messages",
    label: "Mesajlar",
    icon: "/admin/nav-mail.svg",
    match: (path) => path.startsWith("/coordinator/messages"),
  },
];

const COORDINATOR_ROLES = [UserRole.Coordinator, UserRole.Admin];

export function CoordinatorFrame({ children }: { children: ReactNode }) {
  return (
    <RoleFrame
      allowedRoles={COORDINATOR_ROLES}
      homeHref="/coordinator"
      menuLabel="Koordinatör menüsü"
      nav={NAV}
    >
      {children}
    </RoleFrame>
  );
}
