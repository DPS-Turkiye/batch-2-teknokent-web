// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

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

  if (error)
    return (
      <div className="space-y-4">
        <p role="alert">{errorMessage(error, t("failed"))}</p>
        <Link href={`${basePath}/templates`} className="text-sm underline">
          {t("templates.title")}
        </Link>
      </div>
    );
  if (!start) return <p role="status">{t("loading")}</p>;
  // `start` is read once, so another template is another form.
  return (
    <EmailComposeForm
      key={`${programId}:${templateKey}`}
      detail={null}
      basePath={basePath}
      start={start}
    />
  );
}
