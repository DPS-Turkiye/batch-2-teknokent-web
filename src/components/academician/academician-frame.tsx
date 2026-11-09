"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { Workspace } from "@/interfaces/workspace";

export const ACADEMICIAN_HOME = "/academician";

/** Items are `disabled` ("Yakında") until their screen lands; each screen's PR switches its own item on. */
const NAV: RoleNavItem[] = [
  {
    href: ACADEMICIAN_HOME,
    label: "home",
    icon: "/admin/nav-home.svg",
    match: (path) => path === ACADEMICIAN_HOME,
  },
  {
    href: "/academician/requests",
    label: "appointmentRequests",
    icon: "/admin/nav-mail.svg",
    match: (path) => path.startsWith("/academician/requests"),
  },
  {
    href: "/academician/appointments",
    label: "myAppointments",
    icon: "/mentor-dashboard/revised/clock.svg",
    match: (path) => path.startsWith("/academician/appointments"),
  },
  {
    href: "/academician/calendar",
    label: "calendar",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith("/academician/calendar"),
    disabled: true,
  },
  {
    href: "/academician/advisees",
    label: "advisees",
    icon: "/admin/nav-users.svg",
    match: (path) => path.startsWith("/academician/advisees"),
  },
  {
    href: "/academician/profile",
    label: "myProfile",
    icon: "/account-menu/user.svg",
    match: (path) => path.startsWith("/academician/profile"),
  },
];

export function AcademicianFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("roleFrame.workspace");
  return (
    <RoleFrame
      workspace={Workspace.OdtuAcademician}
      homeHref={ACADEMICIAN_HOME}
      menuLabel="academicianMenu"
      nav={NAV}
      roleLabel={t("academician")}
    >
      {children}
    </RoleFrame>
  );
}
