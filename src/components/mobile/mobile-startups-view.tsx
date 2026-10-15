"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { StartupTab, useMobileStartups } from "@/hooks/use-mobile-startups";
import { StartupHealth, type StartupCard } from "@/lib/mobile-startups";

export const HEALTH_CHIP_CLASS: Record<StartupHealth, string> = {
  [StartupHealth.Active]: "bg-[#eaf7f0] text-[#2f9e6b]",
  [StartupHealth.Attention]: "bg-[#fff6e5] text-[#b7791f]",
  [StartupHealth.Past]: "bg-[#f5f6f8] text-[#676e78]",
};

export function HealthChip({ health }: { health: StartupHealth }) {
  const t = useTranslations("mobile.startups.health");
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs leading-[1.35] font-medium ${HEALTH_CHIP_CLASS[health]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t(health)}
    </span>
  );
}

function StartupCardView({ card }: { card: StartupCard }) {
  return (
    <li>
      <Link
        href={card.href}
        className="flex flex-col gap-3.5 rounded-[24px] border border-[#e9ecef] bg-white p-[18px]"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[15px] bg-[#fff1ec] text-[17px] leading-[1.35] font-semibold text-[#e0522a]">
            {card.initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
            <span className="truncate text-[17px] font-semibold text-[#22262b]">
              {card.name}
            </span>
            {card.program ? (
              <span className="truncate text-[13px] text-[#858c96]">
                {card.program}
              </span>
            ) : null}
          </span>
          <HealthChip health={card.health} />
        </span>
        <span className="flex items-center gap-2.5 rounded-[18px] bg-[#f5f6f8] px-3.5 py-3">
          <Image
            src="/mobile/icon-calendar-row.svg"
            alt=""
            width={18}
            height={18}
          />
          <span className="min-w-0 flex-1 text-sm leading-[1.35] font-medium text-[#22262b]">
            {card.nextLine}
          </span>
          <Image
            src="/mobile/icon-chevron-right.svg"
            alt=""
            width={18}
            height={18}
          />
        </span>
      </Link>
    </li>
  );
}

export function MobileStartupsView() {
  const t = useTranslations("mobile.startups");
  const startups = useMobileStartups();
  const tabs = [
    {
      tab: StartupTab.Active,
      label: t("tabActive"),
      count: startups.counts.active,
    },
    { tab: StartupTab.Past, label: t("tabPast"), count: startups.counts.past },
  ];

  return (
    <>
      <MobileScreenHeader
        title={t("title")}
        action={
          <button
            type="button"
            onClick={startups.toggleSearch}
            aria-label={startups.isSearching ? t("closeSearch") : t("search")}
            aria-expanded={startups.isSearching}
            className="flex size-11 items-center justify-center rounded-full bg-[#f5f6f8]"
          >
            <Image
              src="/mobile/icon-search.svg"
              alt=""
              width={22}
              height={22}
            />
          </button>
        }
      />
      <div className="flex flex-col gap-4">
        {startups.isSearching ? (
          <label className="flex h-[46px] items-center gap-2.5 rounded-2xl bg-[#f5f6f8] px-4">
            <span className="sr-only">{t("search")}</span>
            <input
              type="search"
              autoFocus
              value={startups.query}
              onChange={(event) => startups.setQuery(event.target.value)}
              placeholder={t("search")}
              className="min-w-0 flex-1 bg-transparent text-[15px] leading-[1.35] text-[#22262b] outline-none placeholder:text-[#858c96] focus-visible:outline-none!"
            />
          </label>
        ) : null}
        <div
          role="tablist"
          className="flex gap-1 rounded-full bg-[#f5f6f8] p-1 leading-[1.35]"
        >
          {tabs.map((option) => {
            const active = startups.tab === option.tab;
            return (
              <button
                key={option.tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => startups.setTab(option.tab)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm ${
                  active
                    ? "bg-white font-semibold text-[#22262b] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]"
                    : "font-medium text-[#676e78]"
                }`}
              >
                {option.label}
                <span className="text-[13px] font-medium text-[#858c96]">
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        {startups.isLoading ? (
          <MobileListSkeleton />
        ) : startups.isError ? (
          <MobileErrorState title={t("loadError")} onRetry={startups.retry} />
        ) : startups.shown.length === 0 ? (
          startups.query ? (
            <p className="py-6 text-center text-[13.5px] leading-[1.35] text-[#858c96]">
              {t("noMatch", { query: startups.query })}
            </p>
          ) : startups.tab === StartupTab.Active ? (
            <MobileEmptyState
              icon="/mobile/icon-startups.svg"
              title={t("emptyActiveTitle")}
              description={t("emptyActiveDescription")}
            />
          ) : (
            <MobileEmptyState
              icon="/mobile/icon-startups.svg"
              title={t("emptyPastTitle")}
              description={t("emptyPastDescription")}
            />
          )
        ) : (
          <ul aria-label={t("list")} className="flex flex-col gap-4">
            {startups.shown.map((card) => (
              <StartupCardView key={card.id} card={card} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
