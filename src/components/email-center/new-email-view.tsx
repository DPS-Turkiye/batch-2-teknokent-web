// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { QueryNotice } from "@/components/admin/admin-ui";
import { SOLID_LINK } from "@/components/email-center/email-center-header";
import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { useEmailStart } from "@/hooks/use-email-templates";
import type { EmailCenterPath } from "@/lib/email-center";

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
  const tCommon = useTranslations("common");
  const { start, error } = useEmailStart(programId, templateKey);

  if (error)
    return (
      <div className="flex flex-col items-start gap-4">
        <div role="alert">
          <QueryNotice isLoading={false} error={error} />
        </div>
        <Link href={`${basePath}/templates`} className={SOLID_LINK}>
          {t("tabs.templates")}
        </Link>
      </div>
    );
  if (!start)
    return (
      <p role="status" className="text-sm text-[#676e78]">
        {tCommon("loading")}
      </p>
    );
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
