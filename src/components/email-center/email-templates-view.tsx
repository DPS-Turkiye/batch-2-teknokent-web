// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { QueryNotice, StatusChip } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/common/empty-state";
import { PillSelect } from "@/components/coordinator/pill-select";
import {
  EmailCenterHeader,
  SOLID_LINK,
} from "@/components/email-center/email-center-header";
import { FormattedTextPreview } from "@/components/email-center/formatted-text-preview";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { templateHref, type EmailCenterPath } from "@/lib/email-center";

export function EmailTemplatesView({
  basePath,
}: {
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("emailCenter");
  const view = useEmailTemplates();

  return (
    <div className="space-y-6 pb-10">
      <EmailCenterHeader basePath={basePath} onTemplates />
      {view.programs.length > 0 ? (
        <div className="flex">
          <PillSelect
            label={t("program")}
            value={view.programId}
            onChange={view.pickProgram}
            options={view.programs.map((program) => ({
              value: program.id,
              label: program.name,
            }))}
          />
        </div>
      ) : null}
      <div role="status">
        <QueryNotice isLoading={view.isLoading} error={null} />
      </div>
      <div role="alert">
        <QueryNotice isLoading={false} error={view.error} />
      </div>
      {view.hasNoProgram ? (
        <EmptyState title={t("templates.noProgram")} />
      ) : null}
      <ul className="grid gap-4 lg:grid-cols-2">
        {view.templates.map((template) => (
          <li
            key={template.key}
            className="flex flex-col gap-4 rounded-[28px] border border-[#e9ecef] bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-[#22262b]">
                {template.name}
              </h2>
              <StatusChip tone="neutral">
                {t(`audiences.${template.audience}`)}
              </StatusChip>
            </div>
            <p className="text-[13.5px] text-[#676e78]">
              {t("templates.subjectLine", { subject: template.subject })}
            </p>
            <div className="rounded-2xl bg-[#fafbfc] p-4">
              <FormattedTextPreview
                html={template.bodyHtml}
                label={t("templates.preview", { name: template.name })}
              />
            </div>
            <Link
              href={templateHref(basePath, view.programId, template.key)}
              aria-label={t("templates.useNamed", { name: template.name })}
              className={`${SOLID_LINK} mt-auto`}
            >
              {t("templates.use")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
