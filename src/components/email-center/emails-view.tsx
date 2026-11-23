// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { useEmailCampaigns } from "@/hooks/use-email-campaigns";
import {
  problemCount,
  sentCount,
  type EmailCenterPath,
} from "@/lib/email-center";
import { errorMessage, formatDateTime } from "@/lib/utils";

export function EmailsView({ basePath }: { basePath: EmailCenterPath }) {
  const t = useTranslations("emailCenter");
  const locale = useLocale();
  const { campaigns, isLoading, error, sendingOff } = useEmailCampaigns();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#22262b]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-[#676e78]">{t("intro")}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`${basePath}/templates`}
            className="rounded-full border border-[#e4e7ea] px-5 py-2.5 text-sm font-semibold"
          >
            {t("templates.title")}
          </Link>
          <Link
            href={`${basePath}/new`}
            className="rounded-full bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t("newEmail")}
          </Link>
        </div>
      </header>
      {sendingOff ? (
        <p role="status" className="rounded-xl bg-[#fff6ef] p-4 text-sm">
          {t("sendingOff")}
        </p>
      ) : null}
      {isLoading ? <p role="status">{t("loading")}</p> : null}
      {error ? <p role="alert">{errorMessage(error, t("failed"))}</p> : null}
      {!isLoading && !error && campaigns.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#858c96]">{t("empty")}</p>
      ) : null}
      <ul className="space-y-3">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`${basePath}/${campaign.id}`}
              className="block rounded-xl border border-[#e4e7ea] bg-white p-4"
            >
              <p className="font-semibold text-[#22262b]">{campaign.subject}</p>
              <p className="mt-1 text-xs text-[#676e78]">
                {t("campaignLine", {
                  program: campaign.programName,
                  audience: t(`audiences.${campaign.audience}`),
                  sender: campaign.senderName,
                  date: formatDateTime(campaign.createdAt, locale),
                })}
              </p>
              <p className="mt-2 text-xs font-medium">
                {t(`campaignStatuses.${campaign.status}`)}
                {" · "}
                {t("sentCount", { count: sentCount(campaign) })}
                {problemCount(campaign) > 0 ? (
                  <span className="text-[#9b2c2c]">
                    {" · "}
                    {t("problemCount", { count: problemCount(campaign) })}
                  </span>
                ) : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
