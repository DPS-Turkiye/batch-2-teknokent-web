"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { Workspace } from "@/interfaces/workspace";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";

const NAV: RoleNavItem[] = [
  {
    href: ACADEMICIAN_ROUTES.home,
    label: "home",
    icon: "/admin/nav-home.svg",
    match: (path) => path === ACADEMICIAN_ROUTES.home,
  },
  {
    href: ACADEMICIAN_ROUTES.appointments,
    label: "myAppointments",
    icon: "/admin/nav-calendar.svg",
    match: (path) => path.startsWith(ACADEMICIAN_ROUTES.appointments),
  },
  {
    href: ACADEMICIAN_ROUTES.advisees,
    label: "advisees",
    icon: "/admin/nav-users.svg",
    match: (path) => path.startsWith(ACADEMICIAN_ROUTES.advisees),
  },
  {
    href: ACADEMICIAN_ROUTES.profile,
    label: "myProfile",
    icon: "/account-menu/user.svg",
    match: (path) => path.startsWith(ACADEMICIAN_ROUTES.profile),
  },
];

export function AcademicianFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("roleFrame.workspace");
  return (
    <RoleFrame
      workspace={Workspace.OdtuAcademician}
      homeHref={ACADEMICIAN_ROUTES.home}
      menuLabel="academicianMenu"
      nav={NAV}
      roleLabel={t("academician")}
    >
      {children}
    </RoleFrame>
  );
}
