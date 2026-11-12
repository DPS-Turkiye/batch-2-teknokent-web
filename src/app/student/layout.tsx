import type { ReactNode } from "react";

import { StudentFrame } from "@/components/student/student-frame";
import { Edition } from "@/interfaces/edition";
import { requireEdition } from "@/lib/server/edition";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireEdition(Edition.Odtu);
  return <StudentFrame>{children}</StudentFrame>;
}
