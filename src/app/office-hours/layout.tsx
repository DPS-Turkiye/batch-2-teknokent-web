import type { ReactNode } from "react";

import { Edition } from "@/interfaces/edition";
import { requireEdition } from "@/lib/server/edition";

/** The proxy closes this tree outside ODTÜ, but it skips paths with a dot, which a [courseId] segment can carry. */
export default async function OfficeHoursLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireEdition(Edition.Odtu);
  return children;
}
