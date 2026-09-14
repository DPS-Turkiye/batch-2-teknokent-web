"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { STARTUP_TABS } from "@/lib/startup-tabs";

export function StartupTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Startup sekmeleri" className="flex gap-1 overflow-x-auto">
      {STARTUP_TABS.map((tab) => {
        const selected = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`min-w-[120px] flex-1 whitespace-nowrap border-b-[3px] p-3 text-center text-base leading-6 transition ${selected ? "border-[#e86f22] text-[#e86f22]" : "border-[#e4e7ea] text-[#676e78] hover:text-[#22262b]"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
