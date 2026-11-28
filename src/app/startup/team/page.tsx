"use client";

import { StartupPageGate } from "@/components/startup/startup-page-gate";
import { StartupTeamView } from "@/components/startup/startup-team-view";

export default function StartupTeamPage() {
  return (
    <StartupPageGate>
      <StartupTeamView />
    </StartupPageGate>
  );
}
