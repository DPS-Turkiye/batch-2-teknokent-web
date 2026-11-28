"use client";

import { ProgramDetailView } from "@/components/programs/program-detail-view";
import { useLegacyProgramDetailRedirect } from "@/hooks/use-legacy-program-redirect";

export default function ProgramDetailPage() {
  const { waiting } = useLegacyProgramDetailRedirect();
  return waiting ? null : <ProgramDetailView />;
}
