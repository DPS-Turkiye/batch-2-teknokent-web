"use client";

import { usePathname } from "next/navigation";

/** Keep shared program screens inside the role shell that opened them. */
export function useProgramNavigation(programId: string) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin/");
  const listHref = admin ? "/admin/programs" : "/coordinator/programs";
  const baseHref = `${listHref}/${encodeURIComponent(programId)}`;
  const resolveHref = (href: string) => {
    if (!admin) return href;
    return href
      .replace("/coordinator/programs", "/admin/programs")
      .replace("/coordinator/mentorships", "/admin/mentorships");
  };
  return { admin, listHref, baseHref, resolveHref };
}
