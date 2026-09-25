"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { HealthChip } from "@/components/mobile/mobile-startups-view";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import { useMobileStartup } from "@/hooks/use-mobile-startup";

const CARD_CLASS = "w-full rounded-[24px] bg-white";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h2 className="text-[13px] leading-[1.35] font-semibold text-[#858c96] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function LinkRow({
  icon,
  title,
  detail,
  href,
}: {
  icon: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-[18px] py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f6f8]">
          <Image src={icon} alt="" width={18} height={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
          <span className="text-[15px] font-medium text-[#22262b]">
            {title}
          </span>
          <span className="text-[12.5px] text-[#858c96]">{detail}</span>
        </span>
        <Image
          src="/mobile/icon-chevron-right.svg"
          alt=""
          width={18}
          height={18}
        />
      </Link>
    </li>
  );
}

export function MobileStartupView({
  organizationId,
}: {
  organizationId: string;
}) {
  const startup = useMobileStartup(organizationId);
  const detail = startup.detail;

  return (
    <div className="min-h-dvh bg-[#fbfbfc]">
      <MobileTopBar
        title=""
        backHref={startup.backHref}
        backLabel="Startuplara dön"
        tone="white"
      />
      <div className="flex flex-col gap-5 px-5 pb-10">
        {startup.isLoading ? (
          <MobileListSkeleton />
        ) : startup.isError ? (
          <MobileErrorState
            title="Startup yüklenemedi."
            onRetry={startup.retry}
          />
        ) : !detail ? (
          <MobileErrorState
            title="Bu startup ile aktif bir mentorluğun yok."
            description="Geçmiş mentorlukların ayrıntıları web üzerinde."
          />
        ) : (
          <>
            <section className="flex flex-col items-center gap-2.5 text-center leading-[1.35]">
              <span className="flex size-[72px] items-center justify-center rounded-[22px] bg-[#fff1ec] text-[26px] font-semibold text-[#e0522a]">
                {detail.card.initials}
              </span>
              <h1 className="text-2xl font-bold text-[#22262b]">
                {detail.card.name}
              </h1>
              <div className="flex flex-wrap justify-center gap-2">
                {detail.card.program ? (
                  <span className="rounded-full border border-[#e9ecef] bg-white px-2.5 py-[5px] text-xs font-medium text-[#676e78]">
                    {detail.card.program}
                  </span>
                ) : null}
                <HealthChip health={detail.card.health} />
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2.5 text-sm leading-[1.35] font-semibold text-[#22262b]">
              <Link
                href={detail.chatHref}
                className="flex items-center justify-center gap-2 rounded-full border border-[#e9ecef] bg-white py-2.5"
              >
                <Image
                  src="/mobile/icon-message-button.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                Mesaj
              </Link>
              <Link
                href={detail.meetingsHref}
                className="flex items-center justify-center gap-2 rounded-full border border-[#e9ecef] bg-white py-2.5"
              >
                <Image
                  src="/mobile/icon-calendar-row.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                Görüşmeler
              </Link>
            </div>

            {detail.upcoming ? (
              <section
                aria-label="Yaklaşan görüşme"
                className="flex flex-col gap-3 rounded-[24px] bg-[var(--mobile-accent)] p-[18px] leading-[1.35] text-white"
              >
                <p className="text-xs font-semibold tracking-wide">
                  YAKLAŞAN GÖRÜŞME
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-[17px] font-semibold">
                    {detail.upcoming.when}
                  </p>
                  <p className="text-[13px]">{detail.upcoming.detail}</p>
                </div>
              </section>
            ) : null}

            <Group title="Mentorluk bilgileri">
              <dl className={`${CARD_CLASS} divide-y divide-[#f0f2f4] py-1`}>
                {detail.info.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 px-[18px] py-3.5 text-sm leading-[1.35]"
                  >
                    <dt className="text-[#676e78]">{row.label}</dt>
                    <dd className="text-right font-medium text-[#22262b]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Group>

            <Group title="Takım">
              <div className={`${CARD_CLASS} divide-y divide-[#f0f2f4] py-1`}>
                {detail.lead ? (
                  <div className="flex items-center gap-3 px-[18px] py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ec] text-sm font-semibold text-[#e0522a]">
                      {detail.lead.initials}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
                      <p className="truncate text-[15px] font-medium text-[#22262b]">
                        {detail.lead.name}
                      </p>
                      {detail.lead.title ? (
                        <p className="truncate text-[12.5px] text-[#858c96]">
                          {detail.lead.title}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-[#fff1ec] px-2.5 py-[5px] text-xs font-medium text-[#e0522a]">
                      Takım yetkilisi
                    </span>
                  </div>
                ) : null}
                {detail.members.count > 0 ? (
                  <div>
                    <button
                      type="button"
                      onClick={startup.toggleMembers}
                      aria-expanded={startup.membersOpen}
                      className="flex w-full items-center gap-3 px-[18px] py-3.5 text-left"
                    >
                      <span className="flex -space-x-2">
                        {detail.members.initials.map((value) => (
                          <span
                            key={value}
                            className="flex size-[30px] items-center justify-center rounded-full border-2 border-white bg-[#f0f1f3] text-[11px] font-semibold text-[#676e78]"
                          >
                            {value}
                          </span>
                        ))}
                      </span>
                      <span className="flex-1 text-[15px] leading-[1.35] text-[#22262b]">
                        {detail.members.count} ekip üyesi
                      </span>
                      <Image
                        src="/mobile/icon-chevron-down.svg"
                        alt=""
                        width={18}
                        height={18}
                        className={startup.membersOpen ? "rotate-180" : ""}
                      />
                    </button>
                    {startup.membersOpen ? (
                      <ul className="flex flex-col gap-2 px-[18px] pb-3.5 text-sm leading-[1.35] text-[#676e78]">
                        {detail.members.names.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Group>

            <Group title="Aksiyonlar & dosyalar">
              <ul className={`${CARD_CLASS} divide-y divide-[#f0f2f4] py-1`}>
                <LinkRow
                  icon="/mobile/notice-task.svg"
                  title="Verilen görevler"
                  detail={detail.tasks}
                  href={detail.notesHref}
                />
                <LinkRow
                  icon="/mobile/icon-file.svg"
                  title="Dosyalar"
                  detail={detail.files}
                  href={detail.notesHref}
                />
              </ul>
            </Group>

            <div className="flex items-center gap-3 rounded-[18px] bg-[#f5f6f8] px-4 py-3 text-[13px] leading-[1.35]">
              <p className="min-w-0 flex-1 text-[#676e78]">
                Görüşme notları ve değerlendirmeler web’de.
              </p>
              <Link
                href={detail.notesHref}
                className="shrink-0 font-semibold text-[#22262b]"
              >
                Web’de Aç
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
