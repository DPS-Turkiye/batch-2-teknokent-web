"use client";

import type { ReactNode } from "react";

import { StartupTabs } from "@/components/startup/startup-tabs";
import { useStartupHeader } from "@/hooks/use-startup-header";

export const startupPrimaryActionClass =
  "inline-flex items-center justify-center rounded-full bg-[#e86f22] px-4 py-2.5 text-[12.5px] font-medium leading-[19px] text-white transition hover:bg-[#ce5e19] disabled:opacity-60";
export const startupSecondaryActionClass =
  "inline-flex items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[12.5px] font-medium leading-[19px] text-[#4a5059] transition hover:border-[#e86f22] disabled:opacity-60";

const chipClass =
  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-[17px]";

/** The header and tabs every Startup'ım page shares; each page brings its own action. */
export function StartupPageFrame({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  const header = useStartupHeader();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {header.logoUrl ? (
            <span
              role="img"
              aria-label={`${header.name ?? "Startup"} logosu`}
              className="size-[52px] shrink-0 rounded-xl border border-[#e4e7ea] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${header.logoUrl}")` }}
            />
          ) : (
            <span
              aria-hidden
              className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-[#eef7f0] text-[15px] font-semibold text-[#3f7d5a]"
            >
              {header.initials}
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-[28px] font-semibold leading-[42px] text-[#22262b]">
              {header.name ?? (header.isLoading ? "…" : "Startup’ım")}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {header.programName ? (
                <span className="text-[13px] leading-5 text-[#676e78]">
                  {header.programName}
                </span>
              ) : null}
              {header.stageName ? (
                <span
                  className={`${chipClass} border-[#f6c9a5] bg-[#fff4ec] text-[#9e4400]`}
                >
                  {header.stageName} aşaması
                </span>
              ) : null}
              {header.fundingStage ? (
                <span
                  className={`${chipClass} border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]`}
                >
                  {header.fundingStage}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {action}
      </header>
      <StartupTabs />
      {children}
    </div>
  );
}
