// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { OutlineButton, SolidButton } from "@/components/admin/admin-ui";
import { DangerButton } from "@/components/common/danger-button";
import { ModalDialog } from "@/components/common/modal-dialog";
import { DraftQuestionKind, type useEmailDraft } from "@/hooks/use-email-draft";

const TITLE_ID = "email-question-title";

/** Asks before anything that cannot be taken back; for sending it repeats who gets the mail and where replies go. */
export function EmailQuestionDialog({
  form,
  question,
}: {
  form: ReturnType<typeof useEmailDraft>;
  question: DraftQuestionKind;
}) {
  const t = useTranslations("emailCenter");
  const facts = [
    { label: t("program"), value: form.programName },
    { label: t("audience"), value: t(`audiences.${form.savedAudience}`) },
    {
      label: t("recipientCount"),
      value: t("people", { count: form.selectedCount }),
    },
    { label: t("replyToLabel"), value: form.replyTo ?? "–" },
  ];
  return (
    <ModalDialog labelledBy={TITLE_ID} onClose={form.cancelQuestion}>
      <h2 id={TITLE_ID} className="text-[19px] font-semibold text-[#22262b]">
        {t(`questions.${question}.title`, { count: form.selectedCount })}
      </h2>
      {question === DraftQuestionKind.Send ? (
        <dl className="space-y-2 rounded-2xl bg-[#fafbfc] p-4 text-[13.5px]">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-wrap justify-between gap-x-4"
            >
              <dt className="text-[#676e78]">{fact.label}</dt>
              <dd className="font-medium break-all text-[#22262b]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="text-[13.5px] text-[#676e78]">
        {t(`questions.${question}.text`)}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <OutlineButton onClick={form.cancelQuestion}>
          {t("cancel")}
        </OutlineButton>
        {question === DraftQuestionKind.Delete ? (
          <DangerButton disabled={form.isBusy} onClick={form.answerYes}>
            {t(`questions.${question}.yes`)}
          </DangerButton>
        ) : (
          <SolidButton disabled={form.isBusy} onClick={form.answerYes}>
            {t(`questions.${question}.yes`)}
          </SolidButton>
        )}
      </div>
    </ModalDialog>
  );
}
