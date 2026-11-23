// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { PageHeading, Panel, StatusChip } from "@/components/admin/admin-ui";
import { FormattedTextPreview } from "@/components/email-center/formatted-text-preview";
import { RecipientList } from "@/components/email-center/recipient-list";
import type { EmailCampaignDetail } from "@/interfaces/email-center";
import {
  CAMPAIGN_TONES,
  notReached,
  RECIPIENT_TONES,
  statusCounts,
  type EmailCenterPath,
} from "@/lib/email-center";
import { formatDateTime } from "@/lib/utils";
import { RecipientFilter } from "@/types/email-center";

/** What became of a mail; the alert about undelivered mails leads here. */
export function SentEmail({
  detail,
  basePath,
}: {
  detail: EmailCampaignDetail;
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("emailCenter");
  const locale = useLocale();
  const { campaign } = detail;
  const problems = notReached(detail.recipients);

  return (
    <div className="space-y-6 pb-10">
      <PageHeading
        eyebrow={t("campaignLine", {
          program: campaign.programName,
          audience: t(`audiences.${campaign.audience}`),
          sender: campaign.senderName,
          date: formatDateTime(
            campaign.confirmedAt ?? campaign.createdAt,
            locale,
          ),
        })}
        title={campaign.subject}
        subtitle={t("repliesGoTo", { address: detail.replyTo ?? "–" })}
        actions={
          <Link
            href={basePath}
            className="self-start text-[13px] font-medium text-[#676e78] underline"
          >
            {t("backToList")}
          </Link>
        }
      />
      <div>
        <StatusChip tone={CAMPAIGN_TONES[campaign.status]}>
          {t(`campaignStatuses.${campaign.status}`)}
        </StatusChip>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statusCounts(campaign).map(({ status, count }) => (
          <div
            key={status}
            className="rounded-3xl border border-[#e9ecef] bg-white px-5 py-4"
          >
            <dt>
              <StatusChip tone={RECIPIENT_TONES[status]}>
                {t(`statuses.${status}`)}
              </StatusChip>
            </dt>
            <dd className="mt-2 text-[24px] font-semibold text-[#22262b]">
              {count}
            </dd>
          </div>
        ))}
      </dl>
      {problems.length > 0 ? (
        <RecipientList
          title={t("notReached", { count: problems.length })}
          recipients={problems}
          heading="h2"
        />
      ) : null}
      <RecipientList
        title={t("sendLog")}
        recipients={detail.recipients}
        heading="h2"
        filters={Object.values(RecipientFilter).map((id) => ({
          id,
          label: t(`filters.${id}`),
        }))}
      />
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-[#22262b]">
          {t("text")}
        </h2>
        <Panel>
          <div className="p-6">
            <FormattedTextPreview html={detail.bodyHtml} label={t("text")} />
          </div>
        </Panel>
      </section>
    </div>
  );
}
