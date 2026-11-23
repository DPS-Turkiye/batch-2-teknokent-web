// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { useEmailStart } from "@/hooks/use-email-templates";
import type { EmailCenterPath } from "@/lib/email-center";
import { errorMessage } from "@/lib/utils";

export function NewEmailView({
  basePath,
  programId,
  templateKey,
}: {
  basePath: EmailCenterPath;
  programId: string;
  templateKey: string;
}) {
  const t = useTranslations("emailCenter");
  const { start, error } = useEmailStart(programId, templateKey);

  if (error) return <p role="alert">{errorMessage(error, t("failed"))}</p>;
  if (!start) return <p role="status">{t("loading")}</p>;
  return <EmailComposeForm detail={null} basePath={basePath} start={start} />;
}
