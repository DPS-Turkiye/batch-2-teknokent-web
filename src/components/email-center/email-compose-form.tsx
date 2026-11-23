// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { FormattedTextEditor } from "@/components/email-center/formatted-text-editor";
import { RecipientTable } from "@/components/email-center/recipient-table";
import { useEmailDraft } from "@/hooks/use-email-draft";
import {
  EmailAudience,
  type EmailCampaignDetail,
} from "@/interfaces/email-center";
import { EMAIL_SUBJECT_MAX, type EmailCenterPath } from "@/lib/email-center";
import { isEnumValue } from "@/lib/enum";

const FIELD =
  "mt-1 w-full rounded-xl border border-[#e4e7ea] bg-white px-4 py-2.5 text-sm";
const BUTTON =
  "rounded-full border border-[#e4e7ea] px-5 py-2.5 text-sm font-semibold disabled:opacity-50";
const PRIMARY =
  "rounded-full bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50";

export function EmailComposeForm({
  detail,
  basePath,
}: {
  detail: EmailCampaignDetail | null;
  basePath: EmailCenterPath;
}) {
  const t = useTranslations("emailCenter");
  const form = useEmailDraft(detail, basePath);

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-2xl font-semibold text-[#22262b]">
        {form.isNew ? t("newEmail") : t("draftTitle")}
      </h1>
      {form.sendingOff ? (
        <p role="status" className="rounded-xl bg-[#fff6ef] p-4 text-sm">
          {t("sendingOff")}
        </p>
      ) : null}
      <section aria-label={t("steps.write")} className="space-y-4">
        <h2 className="text-lg font-semibold">{t("steps.write")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            {t("program")}
            <select
              className={FIELD}
              value={form.draft.programId}
              onChange={(event) => {
                form.update("programId", event.target.value);
              }}
            >
              <option value="">{t("choose")}</option>
              {form.programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t("audience")}
            <select
              className={FIELD}
              value={form.draft.audience}
              onChange={(event) => {
                const { value } = event.target;
                if (isEnumValue(EmailAudience, value))
                  form.update("audience", value);
              }}
            >
              {Object.values(EmailAudience).map((audience) => (
                <option key={audience} value={audience}>
                  {t(`audiences.${audience}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t("template")}
            <select
              className={FIELD}
              value=""
              disabled={form.templates.length === 0}
              onChange={(event) => {
                form.applyTemplate(event.target.value);
              }}
            >
              <option value="">{t("choose")}</option>
              {form.templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
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
          onChange={(html) => {
            form.update("bodyHtml", html);
          }}
        />
        <p className="text-xs text-[#676e78]">
          {form.replyTo
            ? t("replyTo", { address: form.replyTo })
            : t("replyToLater")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className={PRIMARY}
            disabled={!form.canSave}
            onClick={form.save}
          >
            {t("save")}
          </button>
          {form.isNew ? null : (
            <button
              type="button"
              className={BUTTON}
              disabled={form.isBusy}
              onClick={form.remove}
            >
              {t("delete")}
            </button>
          )}
        </div>
      </section>

      <section aria-label={t("steps.test")} className="space-y-3">
        <h2 className="text-lg font-semibold">{t("steps.test")}</h2>
        <p className="text-sm text-[#676e78]">
          {form.isTested ? t("tested") : t("testHint")}
        </p>
        <button
          type="button"
          className={BUTTON}
          disabled={!form.canTest}
          onClick={form.sendTest}
        >
          {t("sendTest")}
        </button>
      </section>

      <section aria-label={t("steps.review")} className="space-y-3">
        <h2 className="text-lg font-semibold">{t("steps.review")}</h2>
        <p className="text-sm text-[#676e78]">{t("reviewHint")}</p>
        <button
          type="button"
          className={BUTTON}
          disabled={!form.canReview}
          onClick={form.review}
        >
          {form.isReviewed ? t("reviewAgain") : t("showList")}
        </button>
        {form.isReviewed ? (
          <div className="space-y-4">
            <RecipientTable
              caption={t("willGet", { count: form.selectedCount })}
              recipients={form.offered}
              isTicked={form.isTicked}
              onToggle={form.toggle}
            />
            {form.excluded.length > 0 ? (
              <RecipientTable
                caption={t("willNotGet", { count: form.excluded.length })}
                recipients={form.excluded}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-label={t("steps.send")} className="space-y-3">
        <h2 className="text-lg font-semibold">{t("steps.send")}</h2>
        <button
          type="button"
          className={PRIMARY}
          disabled={!form.canSend}
          onClick={form.askToConfirm}
        >
          {t("sendTo", { count: form.selectedCount })}
        </button>
      </section>
      {form.isConfirming ? (
        <ModalDialog
          labelledBy="email-confirm-title"
          onClose={form.cancelConfirm}
        >
          <h2 id="email-confirm-title" className="text-lg font-semibold">
            {t("confirmTitle", { count: form.selectedCount })}
          </h2>
          <p className="text-sm text-[#676e78]">{t("confirmText")}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={BUTTON}
              onClick={form.cancelConfirm}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className={PRIMARY}
              disabled={form.isBusy}
              onClick={form.confirmSend}
            >
              {t("confirmSend")}
            </button>
          </div>
        </ModalDialog>
      ) : null}
    </div>
  );
}
