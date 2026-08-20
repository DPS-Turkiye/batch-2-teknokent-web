"use client";

import Link from "next/link";
import {
  Bell,
  Bot,
  Calendar,
  ClipboardList,
  FolderOpen,
  Home,
  type LucideIcon,
  Users,
  Video,
} from "lucide-react";
import { ReactNode, useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { useDemoSession } from "@/components/providers/session-provider";
import { AppArea } from "@/types/app-area";

interface AppShellProps {
  active?: AppArea;
  actions?: ReactNode;
  backHref?: string;
  children: ReactNode;
  subtitle?: string;
  title?: string;
}

const navigation: Array<{
  id: AppArea;
  label: string;
  href?: string;
  icon: LucideIcon;
}> = [
  { id: AppArea.Home, label: "Ana Sayfa", href: "/dashboard", icon: Home },
  {
    id: AppArea.MentorDashboard,
    label: "Mentor Paneli",
    href: "/mentor-dashboard",
    icon: Users,
  },
  { id: AppArea.Mentorships, label: "Mentorluklarım", icon: Users },
  { id: AppArea.Calendar, label: "Takvim", icon: Calendar },
  {
    id: AppArea.Meetings,
    label: "Toplantılar",
    href: "/meetings/research",
    icon: Video,
  },
  {
    id: AppArea.Actions,
    label: "Aksiyonlar",
    href: "/meetings/research/prepare",
    icon: ClipboardList,
  },
  {
    id: AppArea.Files,
    label: "Dosyalar",
    href: "/meetings/research",
    icon: FolderOpen,
  },
  {
    id: AppArea.Announcements,
    label: "Duyurular",
    href: "/dashboard#notifications",
    icon: Bell,
  },
  {
    id: AppArea.Assistant,
    label: "Toplantı Asistanı",
    href: "/assistant",
    icon: Bot,
  },
];

function BrandBlock() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-[#4f39f6] text-xs font-bold text-white">
        OT
      </span>
      <span className="leading-none">
        <strong className="block text-xs font-semibold text-[#1e2939]">
          ODTÜ Teknokent
        </strong>
        <span className="mt-0.5 block text-[10px] text-[#99a1af]">
          Mentörlük Sistemi
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  active,
  actions,
  backHref,
  children,
  subtitle,
  title,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useDemoSession();
  const displayName = session?.fullName ?? "Ayşe Kaya";
  const displayOrganization =
    session?.role === "MENTOR"
      ? "Mentor"
      : (session?.organizationName ?? "NovaMed AI");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#364153]">
      <aside
        className={`${mobileOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-56 flex-col border-r border-[#f3f4f6] bg-white lg:flex`}
      >
        <div className="flex h-[61px] items-center border-b border-[#f3f4f6] px-5">
          <BrandBlock />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const selected = item.id === active;
            const Icon = item.icon;
            const content = (
              <>
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>{item.label}</span>
                {item.id === AppArea.Announcements ? (
                  <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-[#555] text-[10px] font-semibold text-white">
                    3
                  </span>
                ) : null}
              </>
            );
            const styles = `flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors ${
              selected
                ? "bg-[#eef2ff] font-medium text-[#432dd7]"
                : "text-[#6a7282] hover:bg-[#f9fafb] hover:text-[#364153]"
            }`;
            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={styles}
              >
                {content}
              </Link>
            ) : (
              <span
                key={item.id}
                aria-disabled="true"
                className={`${styles} cursor-not-allowed opacity-60 hover:bg-transparent hover:text-[#6a7282]`}
              >
                {content}
              </span>
            );
          })}
        </nav>
        <div className="border-t border-[#f3f4f6] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={initials || "AK"} tone="purple" />
            <span className="min-w-0 leading-none">
              <strong className="block truncate text-xs font-medium">
                {displayName}
              </strong>
              <span className="mt-1 block truncate text-[10px] text-[#99a1af]">
                {displayOrganization}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}

      <div className="lg:pl-56">
        {!title && !actions ? (
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#f3f4f6] bg-white px-4 lg:hidden">
            <BrandBlock />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md border border-[#e5e7eb] px-3 py-1.5 text-sm"
            >
              Menü
            </button>
          </header>
        ) : null}
        {(title || actions) && (
          <header className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#f3f4f6] bg-white px-4 sm:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md border border-[#e5e7eb] px-2 py-1 text-sm lg:hidden"
            >
              Menü
            </button>
            {backHref ? (
              <Link
                href={backHref}
                aria-label="Geri dön"
                className="text-xl leading-none text-[#99a1af]"
              >
                ←
              </Link>
            ) : null}
            <div className="min-w-0 flex-1 py-3">
              {title ? (
                <h1 className="truncate text-lg font-semibold text-[#171717]">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-[#8a8a8a]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}
