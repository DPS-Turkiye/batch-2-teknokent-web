"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { UserRole } from "@/interfaces/session";

export const STUDENT_HOME = "/student";

/**
 * Items are `disabled` ("Yakında") until their screen lands; each screen's PR switches its own
 * item on. Office Hours belongs to the Office Hours lane.
 */
const NAV: RoleNavItem[] = [
  {
    href: STUDENT_HOME,
    label: "home",
    icon: "/admin/nav-home.svg",
    match: (path) => path === STUDENT_HOME,
  },
  {
    href: "/student/peer-mentoring",
    label: "peerMentoring",
    icon: "/admin/nav-lamp.svg",
    match: (path) => path.startsWith("/student/peer-mentoring"),
    disabled: true,
  },
  {
    href: "/student/office-hours",
    label: "officeHours",
    icon: "/mentor-dashboard/revised/clock.svg",
    match: (path) => path.startsWith("/student/office-hours"),
    disabled: true,
  },
  {
    href: "/student/appointments",
    label: "myAppointments",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith("/student/appointments"),
    disabled: true,
  },
  {
    href: "/student/profile",
    label: "myProfile",
    icon: "/account-menu/user.svg",
    match: (path) => path.startsWith("/student/profile"),
    disabled: true,
  },
];

// Any signed-in account may open it while the workspace runs on fixtures behind the flag;
// the real check (an ODTÜ student identity) comes with the permissions work.
const STUDENT_WORKSPACE_ROLES = Object.values(UserRole);

export function StudentFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("roleFrame.workspace");
  return (
    <RoleFrame
      allowedRoles={STUDENT_WORKSPACE_ROLES}
      homeHref={STUDENT_HOME}
      menuLabel="studentMenu"
      nav={NAV}
      roleLabel={t("student")}
    >
      {children}
    </RoleFrame>
  );
}
