"use client";

import type { CSSProperties, ReactNode } from "react";

import { MobileListSkeleton } from "@/components/mobile/mobile-states";
import { MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { useMobileShell } from "@/hooks/use-mobile-shell";

export function MobileAppShell({ children }: { children: ReactNode }) {
  const { tabs, activeTab, accent, isReady } = useMobileShell();

  return (
    <div
      className="mx-auto min-h-dvh w-full max-w-[480px] bg-white"
      style={{ "--mobile-accent": accent } as CSSProperties}
    >
      {/* Room for the floating tab bar, so the last row is never hidden under it. */}
      <main className="px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(110px+env(safe-area-inset-bottom))]">
        {isReady ? children : <MobileListSkeleton />}
      </main>
      {isReady ? <MobileTabBar tabs={tabs} activeTab={activeTab} /> : null}
    </div>
  );
}

export function MobileScreenHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex min-h-11 items-center justify-between gap-3">
      <h1 className="text-[28px] leading-[1.25] font-bold text-[#22262b]">
        {title}
      </h1>
      {action}
    </header>
  );
}
