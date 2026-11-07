"use client";

import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import type { ProgramTab } from "@/lib/coordinator-program-detail";

/** Katılımcılar and Randevular of a peer or office-hours program: the frame's empty state until Lanes S and O give them screens. */
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
