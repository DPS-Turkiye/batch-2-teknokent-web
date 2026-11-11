"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { Workspace } from "@/interfaces/workspace";

export const STUDENT_HOME = "/student";

/**
 * Items are `disabled` until their screen lands; each screen's PR switches its own item on. Office
 * Hours is `soon`: it runs from Moodle for now, so its page says so with a "Yakında" chip. Links
 * elsewhere in the workspace follow the same switches through `studentRouteReady` / `studentRouteSoon`.
 */
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
    soon: true,
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

/** Whether the workspace screen at `href` (or its section) has landed yet. */
export function studentRouteReady(href: string) {
  const item = STUDENT_NAV.find((nav) => nav.match(href));
  return Boolean(item && !item.disabled);
}

/** Whether the screen at `href` is open but only says what is coming ("Yakında"). */
export function studentRouteSoon(href: string) {
  return Boolean(STUDENT_NAV.find((nav) => nav.match(href))?.soon);
}

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
