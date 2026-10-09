"use client";

import Image from "next/image";
import { ReactNode } from "react";

import { MentonWordmark } from "@/components/common/menton-wordmark";
import { useTranslations } from "next-intl";

export function AuthHeader() {
  return (
    <header className="border-b border-[#dee2e6] bg-white">
      <div className="mx-auto flex h-[60px] max-w-[1376px] items-center px-4 sm:px-8">
        <MentonWordmark />
      </div>
    </header>
  );
}

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <AuthHeader />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[1180px] items-center justify-center gap-[113px]">
          <div className="w-full max-w-[480px] px-2 sm:px-6">{children}</div>
          <div className="hidden w-[531px] shrink-0 lg:block">
            <Image
              src="/auth-illustration.webp"
              alt={t("auth.shellImageAlt")}
              width={1100}
              height={923}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
