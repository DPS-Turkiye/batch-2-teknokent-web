"use client";

import { StartupPageGate } from "@/components/startup/startup-page-gate";
import { StartupHome } from "@/components/startup/startup-start-view";

export default function StartupProfilePage() {
  return (
    <StartupPageGate>
      <StartupHome />
    </StartupPageGate>
  );
}
