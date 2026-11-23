// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { Panel, QueryNotice, StatusChip } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/common/empty-state";
import { ListPagination } from "@/components/common/list-pagination";
import {
  EmailCenterHeader,
  SendingOffNotice,
  SOLID_LINK,
} from "@/components/email-center/email-center-header";
import { useEmailCampaigns } from "@/hooks/use-email-campaigns";
import {
  CAMPAIGN_TONES,
  problemCount,
  sentCount,
  type EmailCenterPath,
} from "@/lib/email-center";
import { formatDateTime } from "@/lib/utils";

export function EmailsView({ basePath }: { basePath: EmailCenterPath }) {
  const t = useTranslations("emailCenter");
  const locale = useLocale();
  const list = useEmailCampaigns();

  return (
    <div className="space-y-6 pb-10">
      <EmailCenterHeader basePath={basePath} onTemplates={false} />
      {list.sendingOff ? <SendingOffNotice /> : null}
      <div role="status">
        <QueryNotice isLoading={list.isLoading} error={null} />
      </div>
      <div role="alert">
        <QueryNotice isLoading={false} error={list.error} />
      </div>
      {list.isEmpty ? (
        <EmptyState
          title={t("empty")}
          body={t("emptyBody")}
          action={
            <Link href={`${basePath}/templates`} className={SOLID_LINK}>
              {t("tabs.templates")}
            </Link>
          }
        />
      ) : null}
      {list.campaigns.length > 0 ? (
        <Panel>
          <ul
            aria-label={t("tabs.emails")}
            className="divide-y divide-[#f0f2f4]"
          >
            {list.campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  href={`${basePath}/${campaign.id}`}
                  className="flex flex-col gap-3 px-5 py-4 hover:bg-[#fafbfc] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium break-words text-[#22262b]">
                      {campaign.subject}
                    </span>
                    <span className="mt-1 block text-[12.5px] text-[#676e78]">
                      {t("campaignLine", {
                        program: campaign.programName,
                        audience: t(`audiences.${campaign.audience}`),
                        sender: campaign.senderName,
                        date: formatDateTime(campaign.createdAt, locale),
                      })}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-2">
                    {sentCount(campaign) > 0 ? (
                      <span className="text-[12.5px] text-[#676e78]">
                        {t("sentCount", { count: sentCount(campaign) })}
                      </span>
                    ) : null}
                    {problemCount(campaign) > 0 ? (
                      <StatusChip tone="red">
                        {t("problemCount", { count: problemCount(campaign) })}
                      </StatusChip>
                    ) : null}
                    <StatusChip tone={CAMPAIGN_TONES[campaign.status]}>
                      {t(`campaignStatuses.${campaign.status}`)}
                    </StatusChip>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <ListPagination
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        label={t("pages")}
      />
    </div>
  );
}
