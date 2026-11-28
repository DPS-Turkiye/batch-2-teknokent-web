"use client";

import { useLegacyProgramsRedirect } from "@/hooks/use-legacy-program-redirect";

// The old coordinator page; backend notifications still link here.
export default function ProgramsPage() {
  useLegacyProgramsRedirect();
  return null;
}
