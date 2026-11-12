import type { ReactNode } from "react";

import { AcademicianFrame } from "@/components/academician/academician-frame";
import { Edition } from "@/interfaces/edition";
import { requireEdition } from "@/lib/server/edition";

export default async function AcademicianLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireEdition(Edition.Odtu);
  return <AcademicianFrame>{children}</AcademicianFrame>;
}
