// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { PageHeading } from "@/components/admin/admin-ui";
import type { EmailCenterPath } from "@/lib/email-center";

export const SOLID_LINK =
  "inline-flex h-10 shrink-0 items-center justify-center self-start rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white";

/** The title and the two sections, E-postalar and Şablonlar. */
export function EmailCenterHeader({
  basePath,
  onTemplates,
}: {
  basePath: EmailCenterPath;
  onTemplates: boolean;
}) {
  const t = useTranslations("emailCenter");
  const tabs = [
    { href: basePath, label: t("tabs.emails"), active: !onTemplates },
    {
      href: `${basePath}/templates`,
      label: t("tabs.templates"),
      active: onTemplates,
    },
  ];
  return (
    <div className="space-y-5">
      <PageHeading
        title={t("title")}
        subtitle={onTemplates ? t("templates.intro") : t("intro")}
        actions={
          <Link href={`${basePath}/new`} className={SOLID_LINK}>
            {t("newEmail")}
          </Link>
        }
      />
      <nav aria-label={t("tabs.label")} className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`inline-flex items-center rounded-full px-4 py-2 text-[13px] ${
              tab.active
                ? "bg-[#22262b] font-medium text-white"
                : "border border-[#e9ecef] text-[#676e78]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SendingOffNotice() {
  const t = useTranslations("emailCenter");
  return (
    <p
      role="status"
      className="rounded-2xl bg-[#fff6e5] px-5 py-3 text-[13.5px] text-[#b7791f]"
    >
      {t("sendingOff")}
    </p>
  );
}
