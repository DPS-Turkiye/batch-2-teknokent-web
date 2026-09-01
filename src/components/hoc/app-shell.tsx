"use client";

import Link from "next/link";
import {
  Bell,
  Bot,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  NotebookPen,
  Star,
  UserPlus,
  Users,
  Video,
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
  if (role === UserRole.Mentor)
    return [
      {
        id: AppArea.MentorDashboard,
        label: "Ana Sayfa",
        href: "/mentor-dashboard",
        icon: Home,
      },
      {
        id: AppArea.Mentorships,
        label: "Mentorluklarım",
        href: "/mentor-dashboard#mentorships",
        icon: Users,
      },
      {
        id: AppArea.Calendar,
        label: "Takvim",
        href: "/calendar",
        icon: CalendarDays,
      },
      {
        id: AppArea.Meetings,
        label: "Mesajlar",
        href: "/mentor-dashboard/messages",
        icon: MessageCircle,
      },
    ];
  return [
    { id: AppArea.Home, label: "Ana Sayfa", href: "/dashboard", icon: Home },
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
  ];
}

const utilityNavigation: NavigationItem[] = [
  {
    id: AppArea.Team,
    label: "Ekibim",
    href: "/team",
    icon: UserPlus,
  },
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
    id: AppArea.Assistant,
    label: "Toplantı Asistanı",
    href: "/assistant",
    icon: Bot,
  },
  {
    id: AppArea.Notes,
    label: "Not Defterleri",
    href: "/notes",
    icon: NotebookPen,
  },
];

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
  const session = useAppSession();
  const { logout } = useSession();
  const isAdmin = session?.role === UserRole.Admin;
  const isMentor = session?.role === UserRole.Mentor;
  const homeHref = isAdmin
    ? "/admin"
    : isMentor
      ? "/mentor-dashboard"
      : "/dashboard";
  const profileHref = isMentor
    ? "/mentor-profile"
    : isAdmin
      ? "/admin"
      : "/profile";
  const navigation = buildNavigation(session?.role);
  // Every utility destination was built around a mentee's organization, meeting
  // flow or identity: /team needs an organization a mentor does not have, and the
  // meeting, assistant and notebook routes render mentee data. They stay hidden
  // for mentors until mentor equivalents exist.
  const extras = isAdmin || isMentor ? [] : utilityNavigation;
  const displayName = session?.fullName ?? "Ayşe Kaya";
  const displayOrganization = isAdmin
    ? "Admin"
    : isMentor
      ? "Mentor"
      : (session?.organizationName ?? "NovaMed AI");

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
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition ${selected ? "bg-[#fdebdd] text-[#c85816]" : "text-[#676e78] hover:bg-white hover:text-[#22262b]"}`}
                >
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {extras.length > 0 ? (
              <details className="relative hidden xl:block">
                <summary className="flex h-10 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-medium text-[#676e78] hover:bg-[#f8f9fa]">
                  Diğer <ChevronDown className="size-3.5" />
                </summary>
                <div className="absolute right-0 top-12 w-52 rounded-2xl border border-[#e4e7ea] bg-white p-2 shadow-xl">
                  {extras.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-[#676e78] hover:bg-[#f8f9fa] hover:text-[#22262b]"
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
            <Link
              href={
                isAdmin
                  ? "/admin"
                  : isMentor
                    ? "/mentor-dashboard#notifications"
                    : "/dashboard#notifications"
              }
              aria-label="Duyurular"
              className="relative grid size-10 place-items-center rounded-full border border-[#e4e7ea] text-[#676e78] hover:border-[#e86f22] hover:text-[#e86f22]"
            >
              <Bell className="size-[18px]" strokeWidth={1.8} />
              {DASHBOARD_NOTIFICATIONS.length ? (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full border-2 border-white bg-[#e86f22] px-0.5 text-[9px] font-bold leading-3 text-white">
                  {DASHBOARD_NOTIFICATIONS.length}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="hidden h-10 items-center gap-1.5 rounded-full border border-[#e4e7ea] px-3 text-xs font-medium text-[#676e78] hover:border-[#e86f22] hover:text-[#e86f22] sm:flex"
            >
              <LogOut className="size-3.5" strokeWidth={1.8} aria-hidden />
              Çıkış
            </button>
            <Link
              href={profileHref}
              className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 hover:border-[#e4e7ea]"
            >
              <Avatar initials={initials(displayName) || "AK"} tone="orange" />
              <span className="hidden max-w-28 leading-tight sm:block">
                <strong className="block truncate text-xs font-semibold">
                  {displayName}
                </strong>
                <span className="block truncate text-[10px] text-[#858c96]">
                  {displayOrganization}
                </span>
              </span>
            </Link>
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
              {[...navigation, ...extras].map((item, index) => (
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
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#676e78] hover:bg-[#fdebdd] hover:text-[#c85816]"
              >
                <LogOut className="size-4" />
                Çıkış
              </button>
            </nav>
          </aside>
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
