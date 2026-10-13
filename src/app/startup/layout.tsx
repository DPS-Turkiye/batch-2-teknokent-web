import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/hoc/app-shell";
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
      <div className="mx-auto w-full max-w-[1228px] px-4 pb-[72px] pt-3 sm:px-6 xl:px-0">
        {children}
      </div>
    </AppShell>
  );
}
