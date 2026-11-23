// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { OutlineButton, SolidButton } from "@/components/admin/admin-ui";
import { ModalDialog } from "@/components/common/modal-dialog";
import type { useTextLink } from "@/hooks/use-text-link";

const FIELD =
  "mt-1.5 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus-visible:border-[#22262b] focus-visible:ring-2 focus-visible:ring-[#22262b] aria-invalid:border-[#b4232a]";

const PANEL =
  "max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl outline-none";

/** The address of a link in a mail's text, and why one cannot be used. */
export function TextLinkDialog({
  link,
}: {
  link: ReturnType<typeof useTextLink>;
}) {
  const t = useTranslations("emailCenter.editor.linkDialog");
  const tCommon = useTranslations("common");
  const id = useId();
  const { form } = link;
  if (!form) return null;

  return (
    <ModalDialog
      labelledBy={`${id}-title`}
      onClose={link.close}
      panelClassName={PANEL}
    >
      <h2
        id={`${id}-title`}
        className="text-[19px] font-semibold text-[#22262b]"
      >
        {form.isEditing ? t("editTitle") : t("addTitle")}
      </h2>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          link.save(event.currentTarget.querySelector("input"));
        }}
      >
        <label className="block text-[13px] text-[#676e78]">
          {t("address")}
          <input
            className={FIELD}
            value={form.address}
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            aria-invalid={form.problem !== null}
            aria-describedby={
              form.problem ? `${id}-problem ${id}-hint` : `${id}-hint`
            }
            onChange={(event) => {
              link.changeAddress(event.target.value);
            }}
          />
        </label>
        {form.needsWords ? (
          <label className="block text-[13px] text-[#676e78]">
            {t("words")}
            <input
              className={FIELD}
              value={form.words}
              autoComplete="off"
              onChange={(event) => {
                link.changeWords(event.target.value);
              }}
            />
          </label>
        ) : null}
        <p id={`${id}-hint`} className="text-[12.5px] text-[#676e78]">
          {t("hint")}
        </p>
        <p
          id={`${id}-problem`}
          role="alert"
          className="text-[13px] font-medium text-[#b4232a]"
        >
          {form.problem ? t(`problems.${form.problem}`) : null}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {form.isEditing ? (
            <OutlineButton onClick={link.remove}>{t("remove")}</OutlineButton>
          ) : null}
          <OutlineButton onClick={link.close}>
            {tCommon("cancel")}
          </OutlineButton>
          <SolidButton type="submit">
            {form.isEditing ? t("save") : t("add")}
          </SolidButton>
        </div>
      </form>
    </ModalDialog>
  );
}
