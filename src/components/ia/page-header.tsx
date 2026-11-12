import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The top of a design-system page: an optional "← back" link, the H1 and actions on the right. `children` go under
 * the title (a subtitle, chips).
 */
export function PageHeader({
  title,
  back,
  actions,
  children,
}: {
  title: ReactNode;
  back?: { href: string; label: string } | undefined;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-6">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 type-label text-text-secondary hover:text-text-primary"
        >
          <Image alt="" src="/ia/icons/arrow-left.svg" width={16} height={16} />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="type-h1 text-text-primary">{title}</h1>
          {children}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
