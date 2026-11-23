"use client";

import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { UserRole } from "@/interfaces/session";
import { EMAIL_CENTER_ENABLED, EmailCenterPath } from "@/lib/email-center";

const NAV: RoleNavItem[] = [
  {
    href: "/coordinator",
    label: "home",
    icon: "/admin/nav-home.svg",
    match: (path) => path === "/coordinator",
  },
  {
    href: "/coordinator/programs",
    label: "myPrograms",
    icon: "/admin/nav-folder.svg",
    match: (path) => path.startsWith("/coordinator/programs"),
  },
  {
    href: "/coordinator/mentorships",
    label: "mentorships",
    icon: "/admin/nav-lamp.svg",
    match: (path) => path.startsWith("/coordinator/mentorships"),
  },
  {
    href: "/coordinator/calendar",
    label: "calendar",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith("/coordinator/calendar"),
  },
  {
    href: "/coordinator/messages",
    label: "messages",
    icon: "/admin/nav-mail.svg",
    match: (path) => path.startsWith("/coordinator/messages"),
  },
  ...(EMAIL_CENTER_ENABLED
    ? [
        {
          href: EmailCenterPath.Coordinator,
          label: "emails" as const,
          icon: "/admin/nav-mail.svg",
          match: (path: string) => path.startsWith(EmailCenterPath.Coordinator),
        },
      ]
    : []),
];

const COORDINATOR_ROLES = [UserRole.Coordinator, UserRole.Admin];

export function CoordinatorFrame({ children }: { children: ReactNode }) {
  return (
    <RoleFrame
      allowedRoles={COORDINATOR_ROLES}
      homeHref="/coordinator"
      menuLabel="coordinatorMenu"
      nav={NAV}
    >
      {children}
    </RoleFrame>
  );
}
