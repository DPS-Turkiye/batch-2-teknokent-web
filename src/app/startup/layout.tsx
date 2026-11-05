import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/hoc/app-shell";
import { StartupApprovalBanner } from "@/components/startup/startup-start-view";
import { AppArea } from "@/types/app-area";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("startup") };
}

export default function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell active={AppArea.Startup} menteeHome>
      <div className="mx-auto w-full max-w-[1228px] space-y-4 px-4 pb-[72px] pt-3 sm:px-6 xl:px-0">
        <StartupApprovalBanner />
        {children}
      </div>
    </AppShell>
  );
}
