"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { Workspace } from "@/interfaces/workspace";

export const STUDENT_HOME = "/student";

/** The ODTÜ student's workspace menu (Figma "Nav / Öğrenci"); the frame itself comes from the IA kit. */
export const STUDENT_NAV: RoleNavItem[] = [
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
  },
  {
    href: "/student/office-hours",
    label: "officeHours",
    icon: "/mentor-dashboard/revised/clock.svg",
    match: (path) => path.startsWith("/student/office-hours"),
  },
  {
    href: "/student/appointments",
    label: "myAppointments",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith("/student/appointments"),
  },
  {
    href: "/student/profile",
    label: "myProfile",
    icon: "/account-menu/user.svg",
    match: (path) => path.startsWith("/student/profile"),
  },
];

export function StudentFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("roleFrame.workspace");
  return (
    <RoleFrame
      workspace={Workspace.OdtuStudent}
      homeHref={STUDENT_HOME}
      menuLabel="studentMenu"
      nav={STUDENT_NAV}
      roleLabel={t("student")}
    >
      {children}
    </RoleFrame>
  );
}
