import type { ReactNode } from "react";

import { requireAdminUserTab } from "@/lib/server/admin-user-tabs";
import { UserTab } from "@/types/admin-users";

export default async function AdminTeamsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUserTab(UserTab.Teams);
  return children;
}
