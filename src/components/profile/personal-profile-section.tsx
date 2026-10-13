"use client";

import { useTranslations } from "next-intl";

import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  EditableInfoChips,
  EditableInfoField,
} from "@/components/profile/editable-info-field";
import { usePersonalProfile } from "@/hooks/use-personal-profile";
import { normalizePhoneInput } from "@/lib/phone";

/**
 * The signup wizard's first step, reopened after signup. Until now these fields
 * were write-only: bio, LinkedIn and expertise were collected, stored by V33,
 * and never shown again.
 */
export function PersonalProfileSection() {
  const t = useTranslations("profileSections");
  const {
    draft,
    setField,
    save,
    saved,
    isLoading,
    isSaving,
    loadError,
    saveError,
    fieldErrors,
    canSave,
  } = usePersonalProfile();

  if (isLoading) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("personalTitle")}</h2>
        <p className="text-sm text-[#676e78]">{t("loading")}</p>
      </section>
    );
  }

  if (loadError || !draft) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("personalTitle")}</h2>
        <p className="text-sm text-[#b91c1c]">{loadError ?? t("loadFailed")}</p>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={cardHeadingClass}>{t("personalTitle")}</h2>
          <p className="mt-1 text-xs text-[#676e78]">{t("personalHint")}</p>
        </div>
        {saved ? (
          <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-medium text-[#15803d]">
            {t("saved")}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EditableInfoField
          id="profile-full-name"
          label={t("fullName")}
          value={draft.fullName}
          required
          error={fieldErrors.fullName}
          maxLength={255}
          onChange={(value) => setField("fullName", value)}
        />
        <EditableInfoField
          id="profile-job-title"
          label={t("role")}
          placeholder={t("rolePlaceholder")}
          value={draft.jobTitle ?? ""}
          error={fieldErrors.jobTitle}
          maxLength={255}
          onChange={(value) => setField("jobTitle", value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EditableInfoField
          id="profile-phone"
          label={t("phone")}
          value={draft.phone ?? ""}
          inputMode="tel"
          maxLength={16}
          error={fieldErrors.phone}
          onChange={(value) => setField("phone", normalizePhoneInput(value))}
        />
        <EditableInfoField
          id="profile-linkedin"
          label={t("linkedin")}
          placeholder="linkedin.com/in/…"
          value={draft.linkedinUrl ?? ""}
          error={fieldErrors.linkedinUrl}
          maxLength={255}
          onChange={(value) => setField("linkedinUrl", value)}
        />
      </div>

      <EditableInfoField
        id="profile-bio"
        label={t("bio")}
        multiline
        placeholder={t("bioPlaceholder")}
        value={draft.bio ?? ""}
        error={fieldErrors.bio}
        maxLength={5000}
        onChange={(value) => setField("bio", value)}
      />

      <EditableInfoChips
        label={t("expertise")}
        values={draft.expertise}
        error={fieldErrors.expertise}
        onChange={(values) => setField("expertise", values)}
      />

      {saveError ? <p className="text-sm text-[#b91c1c]">{saveError}</p> : null}

      <div className="flex justify-end border-t border-[#f1f3f5] pt-4">
        <PrimaryButton onClick={save} disabled={!canSave}>
          {isSaving ? t("saving") : t("save")}
        </PrimaryButton>
      </div>
    </section>
  );
}
