"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { STARTUP_TABS } from "@/lib/startup-tabs";

export function StartupTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Startup sekmeleri" className="flex overflow-x-auto">
      {STARTUP_TABS.map((tab) => {
        const selected = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-w-[96px] flex-1 flex-col items-center gap-2.5 whitespace-nowrap text-[13px] leading-5 transition ${selected ? "font-semibold text-[#c95c18]" : "text-[#676e78] hover:text-[#22262b]"}`}
          >
            {tab.label}
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
