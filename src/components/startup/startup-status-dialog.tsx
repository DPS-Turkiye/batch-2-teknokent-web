"use client";

import { useTranslations } from "next-intl";

import { fieldClass, labelClass } from "@/components/common/form-field";
import { ModalDialog } from "@/components/common/modal-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { useStartupStatusForm } from "@/hooks/use-startup-status-form";

type StartupStatusForm = ReturnType<typeof useStartupStatusForm>;

export function StartupStatusDialog({ form }: { form: StartupStatusForm }) {
  const t = useTranslations("startupProfile.statusDialog");
  if (!form.isOpen) return null;

  return (
    <ModalDialog labelledBy="startup-status-dialog-title" onClose={form.close}>
      <h2
        id="startup-status-dialog-title"
        className="text-base font-semibold text-[#22262b]"
      >
        {t("title")}
      </h2>
      <label className="block">
        <span className={labelClass}>{t("version")}</span>
        <input
          className={fieldClass}
          value={form.draft.statusVersion}
          maxLength={32}
          placeholder="v0.9.2"
          onChange={(event) =>
            form.setField("statusVersion", event.target.value)
          }
        />
      </label>
      <label className="block">
        <span className={labelClass}>{t("summary")}</span>
        <textarea
          className={`${fieldClass} min-h-24 py-2.5`}
          value={form.draft.statusSummary}
          maxLength={5000}
          onChange={(event) =>
            form.setField("statusSummary", event.target.value)
          }
        />
      </label>
      <label className="block">
        <span className={labelClass}>{t("percent")}</span>
        <input
          className={fieldClass}
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={form.draft.completionPercent}
          aria-invalid={Boolean(form.error)}
          aria-describedby={
            form.error ? "startup-status-percent-error" : undefined
          }
          onChange={(event) =>
            form.setField("completionPercent", event.target.value)
          }
        />
      </label>
      {form.error ? (
        <p id="startup-status-percent-error" className="text-xs text-[#c24135]">
          {form.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={form.close}>{t("cancel")}</SecondaryButton>
        <PrimaryButton
          onClick={form.submit}
          disabled={form.isSaving || Boolean(form.error)}
        >
          {form.isSaving ? t("saving") : t("save")}
        </PrimaryButton>
      </div>
    </ModalDialog>
  );
}
