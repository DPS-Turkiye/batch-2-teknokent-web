"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { personProfileHref } from "@/lib/person-profile";
import { isAdminArea } from "@/lib/utils";

/** Where "Profili gör" leads from the current screen: the admin or the coordinator profile page. */
export function usePersonProfileHref() {
  const admin = isAdminArea(usePathname());
  return useCallback(
    (userId: string) => personProfileHref(userId, admin),
    [admin],
  );
}
