import type { ReactNode } from "react";

import { StudentFrame } from "@/components/student/student-frame";
import { requireOdtuWorkspaces } from "@/lib/server/odtu-workspaces";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOdtuWorkspaces();
  return <StudentFrame>{children}</StudentFrame>;
}
