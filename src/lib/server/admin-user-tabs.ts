import { notFound } from "next/navigation";
import { connection } from "next/server";
import "server-only";

import { adminUserTabsOf } from "@/lib/edition-screens";
import { appEdition } from "@/lib/server/edition";
import type { UserTab } from "@/types/admin-users";

/**
 * A Kullanıcılar tab the deployment's edition does not show answers like a missing route. It reads the same list as
 * the tab strip (`adminUserTabsOf`), so the visible tabs and the reachable pages cannot drift apart.
 */
export async function requireAdminUserTab(tab: UserTab) {
  await connection();
  if (!adminUserTabsOf(appEdition()).includes(tab)) notFound();
}
