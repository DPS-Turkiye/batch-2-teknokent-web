import type { ReactNode } from "react";

import { requireAdminUserTab } from "@/lib/server/admin-user-tabs";
import { UserTab } from "@/types/admin-users";

export default async function AdminAcademicsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUserTab(UserTab.Academics);
  return children;
}
