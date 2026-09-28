"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  Home,
  Lightbulb,
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
import { MentonWordmark } from "@/components/common/menton-wordmark";
import { NotificationMenu } from "@/components/common/notification-menu";
import { AccountMenu } from "@/components/hoc/account-menu";
import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { UserRole } from "@/interfaces/session";
import { COMING_SOON_MESSAGE } from "@/lib/personal-profile";
import { roleWorkspace } from "@/lib/role-workspace";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

interface AppShellProps {
  menteeHome?: boolean;
  mentorHome?: boolean;
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

const MENTORS_NAV: NavigationItem = {
  id: AppArea.Mentors,
  label: "Mentörler",
  href: "/mentors",
  icon: GraduationCap,
};

const NOTES_NAV: NavigationItem = {
  id: AppArea.Notes,
  label: "Toplantı Notlarım",
  href: "/notes",
  icon: NotebookPen,
};

function buildNavigation(
  role?: UserRole,
  menteeHome = false,
): NavigationItem[] {
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
        label: "Anasayfa",
        href: "/mentor-dashboard",
        icon: Home,
      },
      {
        id: AppArea.Mentorships,
        label: "Mentorlüklerim",
        href: "/mentorships",
        icon: Lightbulb,
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
    ];
  const menteeNavigation = [
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
    { id: AppArea.Startup, label: "Startup’ım", href: "/startup", icon: Star },
    {
      id: AppArea.Meetings,
      label: "Mesajlar",
      href: "/messages",
      icon: MessageCircle,
    },
    NOTES_NAV,
  ];
  return menteeHome
    ? menteeNavigation.map((item, index) =>
        index === 0 ? { ...item, label: "Anasayfa" } : item,
      )
    : menteeNavigation;
}

export function AppShell({
  menteeHome,
  mentorHome = false,
  active,
  actions,
  backHref,
  children,
  subtitle,
  title,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const session = useAppSession();
  const { logout } = useSession();
  const { showToast } = useToast();
  const photo = useProfilePhoto();
  const {
    homeHref,
    profileHref,
    roleLabel,
    showNotificationBadge,
    usesRoleSubtitle,
  } = roleWorkspace(session?.role);
  const isMentor = session?.role === UserRole.Mentor || mentorHome;
  // A page opts out by passing menteeHome={false}; omitting it gives every
  // mentee the revised frame, so a new page cannot forget to ask for it.
  const menteeFrame = menteeHome ?? session?.role === UserRole.Mentee;
  const navigation = buildNavigation(
    isMentor ? UserRole.Mentor : session?.role,
    menteeFrame,
  );
  const usesRevisedNav = isMentor || menteeFrame;
  const displayName = session?.fullName ?? "Kullanıcı";
  const displayOrganization = usesRoleSubtitle
    ? roleLabel
    : (session?.organizationName ?? "");

  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  return (
    <div
      className={`min-h-screen text-[#22262b] ${mentorHome || menteeFrame ? "bg-white" : "bg-[#f8f9fa]"}`}
    >
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur ${usesRevisedNav ? "mentor-nav" : "border-b border-[#e4e7ea]"}`}
      >
        <div
          className={`mx-auto flex items-center gap-5 px-4 sm:px-8 ${usesRevisedNav ? "h-[106px] max-w-[1440px] justify-between sm:px-6" : "h-[72px] max-w-[1320px]"}`}
        >
          <div className={usesRevisedNav ? "lg:w-[200px]" : undefined}>
            <MentonWordmark href={homeHref} />
          </div>
          <nav
            className={`mx-auto hidden items-center rounded-full bg-[#fcfcfd] lg:flex ${usesRevisedNav ? "gap-4 p-2 shadow-[0_7px_14.5px_rgba(100,100,111,0.10)]" : "border border-[#e4e7ea] p-1"}`}
            aria-label="Ana menü"
          >
            {navigation.map((item) => {
              const selected = item.id === active;
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center justify-center gap-2 rounded-full text-[13px] font-medium transition ${usesRevisedNav ? (isMentor ? "h-[42px] w-[160px] px-3" : "h-[42px] px-3.5") : "h-10 gap-1.5 px-3 xl:gap-2 xl:px-4"} ${selected ? (isMentor ? "bg-[#26a4ff] text-white" : menteeFrame ? "bg-[#e5701d] text-white" : "bg-[#fdebdd] text-[#c85816]") : "text-[#676e78] hover:bg-white hover:text-[#22262b]"}`}
                >
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div
            className={`ml-auto flex items-center gap-2 lg:ml-0 ${usesRevisedNav ? "lg:w-[200px] lg:justify-end" : ""}`}
          >
            <NotificationMenu showBadge={showNotificationBadge} />
            <AccountMenu
              displayName={displayName}
              subtitle={displayOrganization}
              email={session?.email ?? ""}
              initials={initials(displayName) || "K"}
              photoUrl={photo.photoUrl}
              profileHref={profileHref}
              showName={!usesRevisedNav}
              onComingSoon={() =>
                showToast({ message: COMING_SOON_MESSAGE, tone: "info" })
              }
              onLogout={() => setConfirmLogout(true)}
            />
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
              <MentonWordmark href={homeHref} />
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
      <main className={mentorHome ? "mentor-home" : undefined}>{children}</main>
    </div>
  );
}
