"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useIndividualProgram } from "@/hooks/use-individual-program";
import { startupTabsFor } from "@/lib/startup-tabs";

export function StartupTabs() {
  const t = useTranslations("startupFrame");
  const pathname = usePathname();
  const student = useIndividualProgram();
  // Wait for the program, so a student never sees the startup-only tabs flash.
  if (student.isLoading) return null;

  return (
    <nav
      aria-label={t(student.individual ? "studentTabsLabel" : "tabsLabel")}
      className="flex overflow-x-auto"
    >
      {startupTabsFor(student.individual).map((tab) => {
        const selected = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-w-[96px] flex-1 flex-col items-center gap-2.5 whitespace-nowrap text-[13px] leading-5 transition ${selected ? "font-semibold text-[#9e4400]" : "text-[#676e78] hover:text-[#22262b]"}`}
          >
            {t(`tabs.${tab.id}`)}
            <span
              aria-hidden
              className={`w-full ${selected ? "h-0.5 bg-[#e86f22]" : "h-px bg-[#e4e7ea]"}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
