import Link from "next/link";
import type { ReactNode } from "react";

import { organizationStartupHref } from "@/lib/program-links";

const LINK_CLASS =
  "text-[#e86f22] underline decoration-[#e86f22]/50 underline-offset-[3px] transition-colors hover:text-[#c85816] hover:decoration-[#c85816]";

export function StartupNameLink({
  organizationId,
  children,
  className,
}: {
  organizationId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={organizationStartupHref(organizationId)}
      className={[LINK_CLASS, className].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}
