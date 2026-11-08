"use client";

import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import type { ProgramTab } from "@/lib/coordinator-program-detail";

/** Katılımcılar and Randevular of a peer or office-hours program, which have no screens yet: the frame shows its empty state. */
export function ProgramTypeTabView({
  programId,
  tab,
}: {
  programId: string;
  tab: ProgramTab;
}) {
  return (
    <ProgramDetailFrame programId={programId} tab={tab}>
      {() => null}
    </ProgramDetailFrame>
  );
}
