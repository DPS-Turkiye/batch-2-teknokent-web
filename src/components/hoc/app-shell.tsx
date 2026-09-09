"use client";

import Link from "next/link";
import {
  Bell,
  Bot,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  NotebookPen,
  Star,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ReactNode, useState } from "react";

import { Avatar } from "@/components/common/avatar";
import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import { DASHBOARD_NOTIFICATIONS } from "@/lib/const";
import { roleWorkspace } from "@/lib/role-workspace";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

interface AppShellProps {
  active?: AppArea;
  actions?: ReactNode;
  backHref?: string;
  children: ReactNode;
  subtitle?: string;
  title?: string;
}
type NavigationItem = {
  id: AppArea;
  label: string;
  href: string;
  icon: LucideIcon;
};

const NOTES_NAV: NavigationItem = {
  id: AppArea.Notes,
  label: "Not Defterlerim",
  href: "/notes",
  icon: NotebookPen,
};

const ASSISTANT_NAV: NavigationItem = {
  id: AppArea.Assistant,
  label: "Toplantı Asistanı",
  href: "/assistant",
  icon: Bot,
};

const MENTORS_NAV: NavigationItem = {
  id: AppArea.Mentors,
  label: "Mentörler",
  href: "/mentors",
  icon: GraduationCap,
};

function buildNavigation(role?: UserRole): NavigationItem[] {
  if (role === UserRole.Admin) {
    return [
      {
        id: AppArea.Admin,
        label: "Başvurular",
        href: "/admin",
        icon: ClipboardList,
      },
    ];
  }
  if (role === UserRole.Coordinator) {
    return [
      {
        id: AppArea.Programs,
        label: "Programlar",
        href: "/programs",
        icon: FolderKanban,
      },
      MENTORS_NAV,
    ];
  }
  if (role === UserRole.Mentor)
    return [
      {
        id: AppArea.MentorDashboard,
        label: "Ana Sayfa",
        href: "/mentor-dashboard",
        icon: Home,
      },
      MENTORS_NAV,
      {
        id: AppArea.Mentorships,
        label: "Mentorluklarım",
        href: "/mentorships",
        icon: Users,
      },
      {
        id: AppArea.Calendar,
        label: "Takvim",
        href: "/mentor-dashboard/calendar",
        icon: CalendarDays,
      },
      {
        id: AppArea.Meetings,
        label: "Mesajlar",
        href: "/mentor-dashboard/messages",
        icon: MessageCircle,
      },
      ASSISTANT_NAV,
    ];
  return [
    { id: AppArea.Home, label: "Ana Sayfa", href: "/dashboard", icon: Home },
    MENTORS_NAV,
    {
      id: AppArea.Mentorships,
      label: "Mentorluklarım",
      href: "/mentorships",
      icon: Users,
    },
    {
      id: AppArea.Calendar,
      label: "Takvim",
      href: "/calendar",
      icon: CalendarDays,
    },
    { id: AppArea.Startup, label: "Startup’ım", href: "/profile", icon: Star },
    {
      id: AppArea.Meetings,
      label: "Mesajlar",
      href: "/mentor-request/status",
      icon: MessageCircle,
    },
    NOTES_NAV,
  ];
}

function BrandBlock({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2"
      aria-label="metual ana sayfa"
    >
      <span className="text-[22px] font-black tracking-[-0.08em] text-[#e5701d]">
        metual
      </span>
      <span className="hidden h-4 w-px bg-[#e4e7ea] sm:block" />
      <span className="hidden text-[10px] font-medium leading-tight text-[#858c96] sm:block">
        ODTÜ Teknokent
        <br />
        Mentorluk Platformu
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const session = useAppSession();
  const { logout } = useSession();
  const {
    homeHref,
    profileHref,
    notificationsHref,
    roleLabel,
    showNotificationBadge,
    usesRoleSubtitle,
  } = roleWorkspace(session?.role);
  const navigation = buildNavigation(session?.role);
  const displayName = session?.fullName ?? "Kullanıcı";
  const displayOrganization = usesRoleSubtitle
    ? roleLabel
    : (session?.organizationName ?? "");

  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#22262b]">
      <header className="sticky top-0 z-40 border-b border-[#e4e7ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-5 px-4 sm:px-8">
          <BrandBlock href={homeHref} />
          <nav
            className="mx-auto hidden items-center rounded-full border border-[#e4e7ea] bg-[#fcfcfd] p-1 lg:flex"
            aria-label="Ana menü"
          >
            {navigation.map((item) => {
              const selected = item.id === active;
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition xl:gap-2 xl:px-4 ${selected ? "bg-[#fdebdd] text-[#c85816]" : "text-[#676e78] hover:bg-white hover:text-[#22262b]"}`}
                >
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              href={notificationsHref}
              aria-label="Duyurular"
              className="relative grid size-10 place-items-center rounded-full border border-[#e4e7ea] text-[#676e78] hover:border-[#e86f22] hover:text-[#e86f22]"
            >
              <Bell className="size-[18px]" strokeWidth={1.8} />
              {showNotificationBadge && DASHBOARD_NOTIFICATIONS.length ? (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full border-2 border-white bg-[#e86f22] px-0.5 text-[9px] font-bold leading-3 text-white">
                  {DASHBOARD_NOTIFICATIONS.length}
                </span>
              ) : null}
            </Link>
            <div className="relative hidden sm:block">
              <button
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 text-left hover:border-[#e4e7ea]"
              >
                <Avatar initials={initials(displayName) || "K"} tone="orange" />
                <span className="hidden max-w-28 leading-tight sm:block">
                  <strong className="block truncate text-xs font-semibold">
                    {displayName}
                  </strong>
                  <span className="block truncate text-[10px] text-[#858c96]">
                    {displayOrganization}
                  </span>
                </span>
                <span className="sr-only">Hesap menüsünü aç</span>
              </button>
              {accountOpen ? (
                <div
                  role="menu"
                  aria-label="Hesap menüsü"
                  className="absolute right-0 top-12 w-48 rounded-xl border border-[#e4e7ea] bg-white p-1.5 shadow-lg"
                >
                  <Link
                    href={profileHref}
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-[#515861] hover:bg-[#f8f9fa]"
                  >
                    Profilim
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#c24135] hover:bg-red-50"
                  >
                    <LogOut className="size-3.5" aria-hidden />
                    Çıkış yap
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
              className="grid size-10 place-items-center rounded-full border border-[#e4e7ea] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/25 lg:hidden"
          role="presentation"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="ml-auto flex h-full w-[min(88vw,340px)] flex-col bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <BrandBlock href={homeHref} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Menüyü kapat"
                className="grid size-10 place-items-center rounded-full border border-[#e4e7ea]"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 space-y-1">
              {navigation.map((item, index) => (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#676e78] hover:bg-[#fdebdd] hover:text-[#c85816]"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-[#e4e7ea] pt-4">
              <Link
                href={profileHref}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#676e78] hover:bg-[#f8f9fa]"
              >
                <Avatar initials={initials(displayName) || "K"} tone="orange" />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">
                    {displayName}
                  </strong>
                  <span className="block truncate text-[10px] text-[#858c96]">
                    Profilim
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setConfirmLogout(true);
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#c24135] hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Çıkış yap
              </button>
            </div>
          </aside>
        </div>
      ) : null}
      {confirmLogout ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="logout-dialog-title" className="text-base font-semibold">
              Çıkış yapmak istiyor musunuz?
            </h2>
            <p className="mt-2 text-sm text-[#676e78]">
              Devam ederseniz yeniden giriş yapmanız gerekir.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-lg border border-[#d6dade] px-4 py-2 text-xs font-semibold text-[#515861]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg bg-[#c24135] px-4 py-2 text-xs font-semibold text-white"
              >
                Çıkış yap
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {title || actions || backHref ? (
        <div className="border-b border-[#e4e7ea] bg-white">
          <div className="mx-auto flex min-h-16 max-w-[1320px] items-center gap-4 px-4 sm:px-8">
            {backHref ? (
              <Link
                href={backHref}
                aria-label="Geri dön"
                className="text-xl text-[#858c96]"
              >
                ←
              </Link>
            ) : null}
            <div className="min-w-0 flex-1 py-3">
              {title ? (
                <h1 className="truncate text-lg font-semibold">{title}</h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-[#858c96]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions}
          </div>
        </div>
      ) : null}
      <main>{children}</main>
    </div>
  );
}
