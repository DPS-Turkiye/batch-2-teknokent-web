// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { RecipientTable } from "@/components/email-center/recipient-table";
import { useEmailCampaign } from "@/hooks/use-email-campaign";
import type { EmailCenterPath } from "@/lib/email-center";
import { errorMessage } from "@/lib/utils";

export function EmailView({
  id,
  basePath,
}: {
  id: string;
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("emailCenter");
  const { detail, isDraft, isLoading, error } = useEmailCampaign(id);

  if (error && !detail)
    return <p role="alert">{errorMessage(error, t("failed"))}</p>;
  if (isLoading || !detail) return <p role="status">{t("loading")}</p>;
  if (isDraft)
    return <EmailComposeForm key={id} detail={detail} basePath={basePath} />;
  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-[#22262b]">
          {detail.campaign.subject}
        </h1>
        <p role="status" className="mt-2 text-sm text-[#676e78]">
          {t(`campaignStatuses.${detail.campaign.status}`)}
        </p>
      </header>
      <RecipientTable caption={t("sendLog")} recipients={detail.recipients} />
    </div>
  );
}
