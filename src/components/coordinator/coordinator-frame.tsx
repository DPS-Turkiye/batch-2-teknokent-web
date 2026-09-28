"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { RoleFrame, type RoleNavItem } from "@/components/common/role-frame";
import { useAppSession } from "@/components/providers/session-provider";
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
      <AdminReturnBar />
      {children}
    </RoleFrame>
  );
}

/** An admin opens the coordinator screens from Programlar ("Koordinatör ata"); this leads them back. */
function AdminReturnBar() {
  const session = useAppSession();
  if (session?.role !== UserRole.Admin) return null;
  return (
    <p className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f4f5f7] px-4 py-2.5 text-[12.5px] text-[#676e78]">
      Koordinatör ekranlarını yönetici olarak görüyorsun.
      <Link href="/admin/programs" className="font-medium text-[#22262b]">
        ← Yönetim paneline dön
      </Link>
    </p>
  );
}
