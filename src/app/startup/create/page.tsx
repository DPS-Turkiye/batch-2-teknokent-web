"use client";

import { StartupCreateView } from "@/components/startup/startup-create-view";
import { StartupPageGate } from "@/components/startup/startup-page-gate";

export default function StartupCreatePage() {
  return (
    <StartupPageGate>
      <StartupCreateView />
    </StartupPageGate>
  );
}
