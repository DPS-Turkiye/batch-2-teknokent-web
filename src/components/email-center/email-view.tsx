// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { SentEmail } from "@/components/email-center/sent-email";
import { useEmailCampaign } from "@/hooks/use-email-campaign";
import type { EmailCenterPath } from "@/lib/email-center";

export function EmailView({
  id,
  basePath,
}: {
  id: string;
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("common");
  const { detail, isDraft, isLoading, error } = useEmailCampaign(id);

  if (error && !detail)
    return (
      <div role="alert">
        <QueryNotice isLoading={false} error={error} />
      </div>
    );
  if (isLoading || !detail)
    return (
      <p role="status" className="text-sm text-[#858c96]">
        {t("loading")}
      </p>
    );
  return isDraft ? (
    <EmailComposeForm key={id} detail={detail} basePath={basePath} />
  ) : (
    <SentEmail detail={detail} basePath={basePath} />
  );
}
