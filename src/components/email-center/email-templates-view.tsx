// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { FormattedTextPreview } from "@/components/email-center/formatted-text-preview";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { templateHref, type EmailCenterPath } from "@/lib/email-center";
import { errorMessage } from "@/lib/utils";

export function EmailTemplatesView({
  basePath,
}: {
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("emailCenter");
  const view = useEmailTemplates();

  return (
    <div className="space-y-6 pb-10">
      <header>
        <Link href={basePath} className="text-sm text-[#676e78] underline">
          {t("title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[#22262b]">
          {t("templates.title")}
        </h1>
        <p className="mt-2 text-sm text-[#676e78]">{t("templates.intro")}</p>
      </header>
      {view.programs.length > 0 ? (
        <label className="block max-w-sm text-sm">
          {t("program")}
          <select
            className="mt-1 w-full rounded-xl border border-[#e4e7ea] bg-white px-4 py-2.5 text-sm"
            value={view.programId}
            onChange={(event) => {
              view.pickProgram(event.target.value);
            }}
          >
            {view.programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {view.isLoading ? <p role="status">{t("loading")}</p> : null}
      {view.error ? (
        <p role="alert">{errorMessage(view.error, t("failed"))}</p>
      ) : null}
      {view.hasNoProgram ? <p>{t("templates.noProgram")}</p> : null}
      <ul className="grid gap-4 lg:grid-cols-2">
        {view.templates.map((template) => (
          <li
            key={template.key}
            className="flex flex-col gap-3 rounded-xl border border-[#e4e7ea] bg-white p-5"
          >
            <h2 className="text-lg font-semibold text-[#22262b]">
              {template.name}
            </h2>
            <p className="text-xs text-[#676e78]">
              {t("templates.line", {
                audience: t(`audiences.${template.audience}`),
                subject: template.subject,
              })}
            </p>
            <FormattedTextPreview
              html={template.bodyHtml}
              label={t("templates.preview", { name: template.name })}
            />
            <Link
              href={templateHref(basePath, view.programId, template.key)}
              aria-label={t("templates.useNamed", { name: template.name })}
              className="mt-auto self-start rounded-full bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("templates.use")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
