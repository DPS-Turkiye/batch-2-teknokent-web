// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  OutlineButton,
  PageHeading,
  SolidButton,
} from "@/components/admin/admin-ui";
import { PillSelect } from "@/components/coordinator/pill-select";
import { SendingOffNotice } from "@/components/email-center/email-center-header";
import { EmailQuestionDialog } from "@/components/email-center/email-question-dialog";
import { EmailStep } from "@/components/email-center/email-step";
import { FormattedTextEditor } from "@/components/email-center/formatted-text-editor";
import { RecipientList } from "@/components/email-center/recipient-list";
import { useEmailDraft } from "@/hooks/use-email-draft";
import {
  EmailAudience,
  type EmailCampaignDetail,
  type EmailDraft,
} from "@/interfaces/email-center";
import { EMAIL_SUBJECT_MAX, type EmailCenterPath } from "@/lib/email-center";
import { isEnumValue } from "@/lib/enum";
import { EmailStep as Step } from "@/types/email-center";

const FIELD =
  "mt-1.5 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

export function EmailComposeForm({
  detail,
  basePath,
  start,
}: {
  detail: EmailCampaignDetail | null;
  basePath: EmailCenterPath;
  /** What a new mail starts with. */
  start?: EmailDraft;
}) {
  const t = useTranslations("emailCenter");
  const form = useEmailDraft(detail, basePath, start);

  return (
    <div className="space-y-6 pb-10">
      <PageHeading
        title={form.isNew ? t("newEmail") : t("draftTitle")}
        subtitle={t("composeIntro")}
        actions={
          <Link
            href={basePath}
            className="self-start text-[13px] font-medium text-[#676e78] underline"
          >
            {t("backToList")}
          </Link>
        }
      />
      {form.sendingOff ? <SendingOffNotice /> : null}
      <ol className="space-y-4">
        <EmailStep number={1} step={Step.Write} state={form.steps[Step.Write]}>
          <fieldset disabled={form.isWaitingForSave} className="space-y-4">
            <legend className="sr-only">{t("steps.write")}</legend>
            <div className="flex flex-wrap gap-2">
              <PillSelect
                label={t("program")}
                value={form.draft.programId}
                onChange={(value) => {
                  form.update("programId", value);
                }}
                options={[
                  { value: "", label: t("choose") },
                  ...form.programs.map((program) => ({
                    value: program.id,
                    label: program.name,
                  })),
                ]}
              />
              <PillSelect
                label={t("audience")}
                value={form.draft.audience}
                onChange={(value) => {
                  if (isEnumValue(EmailAudience, value))
                    form.update("audience", value);
                }}
                options={Object.values(EmailAudience).map((audience) => ({
                  value: audience,
                  label: t(`audiences.${audience}`),
                }))}
              />
              <PillSelect
                label={t("template")}
                value=""
                onChange={form.chooseTemplate}
                options={[
                  { value: "", label: t("choose") },
                  ...form.templates.map((template) => ({
                    value: template.key,
                    label: template.name,
                  })),
                ]}
              />
            </div>
            <label className="block text-[13px] text-[#676e78]">
              {t("subject")}
              <input
                className={FIELD}
                value={form.draft.subject}
                maxLength={EMAIL_SUBJECT_MAX}
                onChange={(event) => {
                  form.update("subject", event.target.value);
                }}
              />
            </label>
            <FormattedTextEditor
              key={form.textVersion}
              html={form.draft.bodyHtml}
              disabled={form.isWaitingForSave}
              onChange={(html) => {
                form.update("bodyHtml", html);
              }}
            />
            <p className="text-[12.5px] break-words text-[#858c96]">
              {form.replyTo
                ? t("replyTo", { address: form.replyTo })
                : t("replyToLater")}
            </p>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <SolidButton disabled={!form.canSave} onClick={form.save}>
              {t("save")}
            </SolidButton>
            {form.isNew ? null : (
              <OutlineButton disabled={form.isBusy} onClick={form.askToDelete}>
                {t("delete")}
              </OutlineButton>
            )}
          </div>
        </EmailStep>

        <EmailStep number={2} step={Step.Test} state={form.steps[Step.Test]}>
          <p className="text-[13.5px] text-[#676e78]">
            {form.isTested ? t("tested") : t("testHint")}
          </p>
          <OutlineButton disabled={!form.canTest} onClick={form.sendTest}>
            {t("sendTest")}
          </OutlineButton>
        </EmailStep>

        <EmailStep
          number={3}
          step={Step.Review}
          state={form.steps[Step.Review]}
        >
          <p className="text-[13.5px] text-[#676e78]">{t("reviewHint")}</p>
          <OutlineButton disabled={!form.canReview} onClick={form.review}>
            {form.isReviewed ? t("reviewAgain") : t("showList")}
          </OutlineButton>
          {form.isReviewed ? (
            <div className="space-y-6">
              <RecipientList
                title={t("willGet", { count: form.selectedCount })}
                recipients={form.offered}
                isTicked={form.isTicked}
                onToggle={form.toggle}
              />
              {form.excluded.length > 0 ? (
                <RecipientList
                  title={t("willNotGet", { count: form.excluded.length })}
                  recipients={form.excluded}
                />
              ) : null}
              <p
                role="status"
                className="sticky bottom-3 z-10 rounded-full bg-[#22262b] px-5 py-3 text-center text-[13px] font-medium text-white shadow-[0_12px_32px_rgba(33,38,43,0.2)]"
              >
                {t("finalCount", {
                  count: form.selectedCount,
                  excluded: form.excluded.length,
                })}
              </p>
            </div>
          ) : null}
        </EmailStep>

        <EmailStep number={4} step={Step.Send} state={form.steps[Step.Send]}>
          <p className="text-[13.5px] text-[#676e78]">{t("sendHint")}</p>
          <SolidButton disabled={!form.canSend} onClick={form.askToSend}>
            {t("sendTo", { count: form.selectedCount })}
          </SolidButton>
        </EmailStep>
      </ol>
      {form.question ? (
        <EmailQuestionDialog form={form} question={form.question} />
      ) : null}
    </div>
  );
}
