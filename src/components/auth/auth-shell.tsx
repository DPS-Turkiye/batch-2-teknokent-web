"use client";

import type { ReactNode } from "react";

import { LanguageSwitch } from "@/components/common/language-switch";
import { MentonWordmark } from "@/components/common/menton-wordmark";

export function AuthHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <MentonWordmark />
      <LanguageSwitch />
    </header>
  );
}

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <div className="px-4 pt-6 sm:px-8">
        <AuthHeader />
      </div>
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-[#111827]">
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <AuthHeader />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[384px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
