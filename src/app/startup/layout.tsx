import type { Metadata } from "next";

import { AppShell } from "@/components/hoc/app-shell";
import { StartupTabs } from "@/components/startup/startup-tabs";
import { AppArea } from "@/types/app-area";

export const metadata: Metadata = {
  title: "Startup’ım",
};

export default function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell active={AppArea.Startup}>
      <div className="mx-auto w-full max-w-[1116px] px-4 pb-16 pt-8 sm:px-6 xl:px-0">
        <StartupTabs />
        <div className="mt-6">{children}</div>
      </div>
    </AppShell>
  );
}
