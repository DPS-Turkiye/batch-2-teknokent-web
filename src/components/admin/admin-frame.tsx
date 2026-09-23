"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminIcon } from "@/components/admin/admin-ui";
import { NotificationMenu } from "@/components/common/notification-menu";
import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import { roleWorkspace } from "@/lib/role-workspace";
import { initials } from "@/lib/utils";

const NAV: {
  href: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
}[] = [
  {
    href: "/admin",
    label: "Anasayfa",
    icon: "/admin/nav-home.svg",
    match: (path) => path === "/admin",
  },
  {
    href: "/admin/programs",
    label: "Programlar",
    icon: "/admin/nav-folder.svg",
    match: (path) => path.startsWith("/admin/programs"),
  },
  {
    href: "/admin/users",
    label: "Kullanıcılar",
    icon: "/admin/nav-users.svg",
    match: (path) => path.startsWith("/admin/users"),
  },
  {
    href: "/admin/mentorships",
    label: "Mentorluklar",
    icon: "/admin/nav-lamp.svg",
    match: (path) => path.startsWith("/admin/mentorships"),
  },
  {
    href: "/admin/reporting",
    label: "Raporlama",
    icon: "/admin/nav-chart.svg",
    match: (path) => path.startsWith("/admin/reporting"),
  },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const session = useAppSession();
  const { isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) return;
    if (session.role !== UserRole.Admin) {
      router.replace(roleWorkspace(session.role).homeHref);
    }
  }, [isLoading, router, session]);

  if (isLoading || !session || session.role !== UserRole.Admin) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-sm text-[#858c96]">
        Yükleniyor…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session = useAppSession();
  const { logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const name = session?.fullName ?? "Admin";
  const mark = initials(name) || "AD";

  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  return (
    <div className="min-h-screen bg-white text-[#22262b]">
      <header className="sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[106px] sm:px-8 lg:px-12">
          <Link
            href="/admin"
            className="text-[28px] font-bold leading-[1.3] tracking-[-0.84px] text-[#898989] sm:text-[32px] sm:tracking-[-0.96px]"
          >
            menton
          </Link>
          <nav
            aria-label="Admin menüsü"
            className="hidden items-center gap-1 rounded-full border border-[#f0f2f4] bg-[#fcfcfd] p-2 shadow-[0_8px_24px_rgba(33,38,43,0.06)] lg:flex"
          >
            {NAV.map((item) => (
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
                    Admin
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
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#22262b] hover:bg-[#f8f9fa]"
                  >
                    <LogOut className="size-4" />
                    Çıkış yap
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-[#e9ecef] lg:hidden"
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
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
            aria-label="Admin menüsü"
            className="space-y-1 border-t border-[#f0f2f4] px-4 py-3 lg:hidden"
          >
            {NAV.map((item) => (
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
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 sm:pt-7 lg:px-12">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV)[number];
  active: boolean;
}) {
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
      {item.label}
    </Link>
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
