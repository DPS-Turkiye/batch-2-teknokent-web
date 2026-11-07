import type { ReactNode } from "react";

import { AcademicianFrame } from "@/components/academician/academician-frame";
import { requireOdtuWorkspaces } from "@/lib/server/odtu-workspaces";

export default function AcademicianLayout({
  children,
}: {
  children: ReactNode;
}) {
  requireOdtuWorkspaces();
  return <AcademicianFrame>{children}</AcademicianFrame>;
}
