"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

import { useDemoSession } from "@/components/providers/session-provider";

type AppArea =
  | "home"
  | "mentorships"
  | "calendar"
  | "meetings"
  | "actions"
  | "files"
  | "announcements"
  | "mentor-dashboard";

interface AppShellProps {
  active?: AppArea;
  actions?: ReactNode;
  backHref?: string;
  children: ReactNode;
  onBack?: () => void;
  organizationName?: string;
  subtitle?: string;
  title?: string;
}

const navigation: Array<{
  id: AppArea;
  label: string;
  href?: string;
  icon: string;
}> = [
  { id: "home", label: "Ana Sayfa", href: "/dashboard", icon: "home" },
  {
    id: "mentor-dashboard",
    label: "Mentor Paneli",
    href: "/mentor-dashboard",
    icon: "mentorships",
  },
  {
    id: "mentorships",
    label: "Mentorluklarım",
    icon: "mentorships",
  },
  {
    id: "calendar",
    label: "Takvimim",
    href: "/calendar",
    icon: "calendar",
  },
  {
    id: "meetings",
    label: "Toplantılar",
    href: "/meetings/research",
    icon: "meetings",
  },
  {
    id: "actions",
    label: "Aksiyonlar",
    href: "/meetings/research/prepare",
    icon: "actions",
  },
  { id: "files", label: "Dosyalar", href: "/meetings/research", icon: "files" },
  {
    id: "announcements",
    label: "Duyurular",
    href: "/dashboard#notifications",
    icon: "announcements",
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
  onBack,
  organizationName = "NovaMed AI",
  subtitle,
  title,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useDemoSession();
  const router = useRouter();
  const resolvedOrganizationName =
    session?.organizationName ?? organizationName;
  const resolvedUserName = session?.fullName ?? "Mentee";
  const userInitials = resolvedUserName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

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
            const content = (
              <>
                <span className="relative size-4 shrink-0 overflow-hidden">
                  <Image
                    src={`/app-icons/${item.icon}.svg`}
                    alt=""
                    fill
                    sizes="16px"
                  />
                </span>
                <span>{item.label}</span>
                {item.id === "announcements" ? (
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
            <Avatar initials={userInitials || "ME"} tone="purple" />
            <span className="min-w-0 leading-none">
              <strong className="block truncate text-xs font-medium">
                {resolvedUserName}
              </strong>
              <span className="mt-1 block truncate text-[10px] text-[#99a1af]">
                {resolvedOrganizationName}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="ml-auto text-[10px] text-[#99a1af] underline"
            >
              Çıkış
            </button>
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
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Geri dön"
                className="text-xl leading-none text-[#99a1af]"
              >
                ←
              </button>
            ) : backHref ? (
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

export function Avatar({
  initials,
  tone = "gray",
  size = "md",
}: {
  initials: string;
  tone?: "gray" | "purple" | "teal";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    gray: "bg-[#eeeeee] text-[#555]",
    purple: "bg-[#f3e8ff] text-[#8200db]",
    teal: "bg-[#cbfbf1] text-[#00786f]",
  };
  const sizes = {
    sm: "size-7 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tones[tone]} ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "amber" | "purple";
}) {
  const tones = {
    gray: "bg-[#f5f5f5] text-[#555]",
    green: "bg-[#f0fdf4] text-[#008236]",
    amber: "bg-[#fffbeb] text-[#bb4d00]",
    purple: "bg-[#eef2ff] text-[#432dd7]",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = `inline-flex min-h-9 items-center justify-center rounded-md bg-[#555] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#3f3f3f] disabled:cursor-not-allowed disabled:bg-[#aaa] ${className}`;
  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = `inline-flex min-h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#555] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:text-[#aaa] disabled:hover:bg-white ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </button>
  );
}
