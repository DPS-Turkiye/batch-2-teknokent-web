import Link from "next/link";
import type { ReactNode } from "react";

import { programPersonHref } from "@/lib/program-links";

/** A person's row: a link to their profile page when the viewer may open it, plain otherwise. */
export function PersonLink({
  userId,
  linked,
  className,
  children,
}: {
  userId: string;
  linked: boolean;
  className: string;
  children: ReactNode;
}) {
  if (!linked) return <div className={className}>{children}</div>;
  return (
    <Link
      href={programPersonHref({ userId })}
      className={`${className} hover:bg-[#f7f8f9]`}
    >
      {children}
    </Link>
  );
}
