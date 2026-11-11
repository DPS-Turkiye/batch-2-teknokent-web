"use client";

import { UsersView } from "@/components/admin/users-view";
import { UserTab } from "@/types/admin-users";

export default function AdminTeamsPage() {
  return <UsersView tab={UserTab.Teams} />;
}
