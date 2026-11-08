"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";

/** Replaces a tab URL the program's type does not show with the type's own tab. */
export function ProgramTabRedirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return <QueryNotice isLoading error={null} />;
}
