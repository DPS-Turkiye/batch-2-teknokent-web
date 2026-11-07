"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { AdminIcon } from "@/components/admin/admin-ui";
import { MentonWordmark } from "@/components/common/menton-wordmark";
import { NotificationMenu } from "@/components/common/notification-menu";
import { FeedbackButton } from "@/components/dashboard/feedback-button";
import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import type messages from "@/messages/tr.json";
import { useRoleGate } from "@/hooks/use-role-gate";
import { AccountSettingsDialog } from "@/components/hoc/account-dialogs";
import { initials } from "@/lib/utils";

export type RoleNavItem = {
  href: string;
  label: keyof (typeof messages)["roleFrame"]["nav"];
  icon: string;
  match: (path: string) => boolean;
  /** Shown but not yet clickable: the screen has a design but no page yet. */
  disabled?: boolean;
};

/**
 * The white menton frame shared by the staff workspaces (admin, coordinator): logo, pill menu,
 * notifications and account menu. Anyone whose role is not allowed is sent to their own home.
 */
export function RoleFrame({
  allowedRoles,
  homeHref,
  menuLabel,
  nav,
  children,
}: {
  allowedRoles: UserRole[];
  homeHref: string;
  menuLabel: "coordinatorMenu" | "adminMenu";
  nav: RoleNavItem[];
  children: ReactNode;
}) {
  const t = useTranslations("common");
  const { allowed, isLoading } = useRoleGate(allowedRoles);

  if (isLoading || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-sm text-[#858c96]">
        {t("loading")}
      </div>
    );
  }

  return (
    <RoleShell homeHref={homeHref} menuLabel={menuLabel} nav={nav}>
      {children}
    </RoleShell>
  );
}

function RoleShell({
  homeHref,
  menuLabel,
  nav,
  children,
}: {
  homeHref: string;
  menuLabel: "coordinatorMenu" | "adminMenu";
  nav: RoleNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const session = useAppSession();
  const { logout } = useSession();
  const t = useTranslations("appShell");
  const tFrame = useTranslations("roleFrame");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tAccount = useTranslations("accountMenu");
  const roleLabel = t(`roles.${session?.role ?? UserRole.Mentee}`);
  const name = session?.fullName ?? roleLabel;
  const mark = initials(name) || "AD";

  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  return (
    <div className="min-h-screen bg-white text-[#22262b]">
      <header className="sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[106px] sm:px-8 lg:px-12">
          <MentonWordmark href={homeHref} />
          <nav
            aria-label={tFrame(menuLabel)}
            className="hidden items-center gap-1 rounded-full border border-[#f0f2f4] bg-[#fcfcfd] p-2 shadow-[0_8px_24px_rgba(33,38,43,0.06)] lg:flex"
          >
            {nav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={item.match(pathname)}
              />
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationMenu appearance="admin" />
            <span className="hidden h-6 w-px bg-[#dde1e6] sm:block" />
            <div className="relative">
              <button
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-2"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#fbe2d0] text-[11px] leading-[1.3] font-semibold text-[#a8480e]">
                  {mark}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[12.5px] font-medium">
                    {name}
                  </span>
                  <span className="block text-[11px] text-[#858c96]">
                    {roleLabel}
                  </span>
                </span>
                <AdminIcon
                  src="/admin/nav-chevron.svg"
                  width={16}
                  height={16}
                  className="hidden sm:block"
                />
              </button>
              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-[#e9ecef] bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#22262b] hover:bg-[#f8f9fa]"
                  >
                    <Settings aria-hidden className="size-4" />
                    {tAccount("settings")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#22262b] hover:bg-[#f8f9fa]"
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-[#e9ecef] lg:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav
            aria-label={tFrame(menuLabel)}
            className="space-y-1 border-t border-[#f0f2f4] px-4 py-3 lg:hidden"
          >
            {nav.map((item) =>
              item.disabled ? (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm text-[#cfd4da]"
                >
                  <NavGlyph src={item.icon} />
                  {tFrame(`nav.${item.label}`)}
                  <SoonBadge />
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={item.match(pathname) ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm ${
                    item.match(pathname)
                      ? "bg-[#22262b] text-white"
                      : "text-[#676e78]"
                  }`}
                >
                  <NavGlyph src={item.icon} />
                  {tFrame(`nav.${item.label}`)}
                </Link>
              ),
            )}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 sm:pt-7 lg:px-12">
        {children}
      </main>
      {pathname === homeHref ? <FeedbackButton /> : null}
      {settingsOpen ? (
        <AccountSettingsDialog onClose={() => setSettingsOpen(false)} />
      ) : null}
    </div>
  );
}

function NavLink({ item, active }: { item: RoleNavItem; active: boolean }) {
  const t = useTranslations("roleFrame");
  if (item.disabled) {
    return (
      <span
        aria-disabled="true"
        title={t("soon")}
        className="flex cursor-default items-center gap-2 rounded-full px-[18px] py-[11px] text-[14px] leading-[1.3] text-[#cfd4da]"
      >
        <NavGlyph src={item.icon} />
        {t(`nav.${item.label}`)}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-full px-[18px] py-[11px] text-[14px] leading-[1.3] ${
        active
          ? "bg-[#22262b] font-medium text-white"
          : "font-normal text-[#aeb4bc] hover:text-[#676e78]"
      }`}
    >
      <NavGlyph src={item.icon} />
      {t(`nav.${item.label}`)}
    </Link>
  );
}

function SoonBadge() {
  const t = useTranslations("roleFrame");
  return (
    <span className="ml-auto rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11px] text-[#858c96]">
      {t("soon")}
    </span>
  );
}

function NavGlyph({ src }: { src: string }) {
  return (
    <span
      aria-hidden
      className="size-5 shrink-0 bg-current"
      style={{
        mask: `url(${src}) center / 20px 20px no-repeat`,
        WebkitMask: `url(${src}) center / 20px 20px no-repeat`,
      }}
    />
  );
}
