"use client";

import { StartupPageGate } from "@/components/startup/startup-page-gate";
import { StartupProfileToolsView } from "@/components/startup/startup-profile-tools-view";

export default function StartupProfileToolsPage() {
  return (
    <StartupPageGate strict path="/startup/profile-tools">
      <StartupProfileToolsView />
    </StartupPageGate>
  );
}
