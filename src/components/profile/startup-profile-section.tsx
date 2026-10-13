"use client";

import { useTranslations } from "next-intl";

import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  EditableInfoChips,
  EditableInfoField,
} from "@/components/profile/editable-info-field";
import { useStartupProfile } from "@/hooks/use-startup-profile";
import { StartupFundingStage } from "@/interfaces/organization";
import { STARTUP_STAGE_OPTIONS } from "@/interfaces/signup";
import { toFoundedYear, toFundingStage } from "@/lib/profile-validation";

/**
 * The signup wizard's second step, reopened after signup. Grouped the way that
 * step groups it — Temel bilgiler, Girişim hakkında, Destek alanları — so a
 * founder edits what they originally typed, in the shape they typed it.
 */
export function StartupProfileSection() {
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
  } = useStartupProfile();

  if (isLoading) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("startupTitle")}</h2>
        <p className="text-sm text-[#676e78]">{t("loading")}</p>
      </section>
    );
  }

  if (loadError || !draft) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("startupTitle")}</h2>
        <p className="text-sm text-[#b91c1c]">{loadError ?? t("loadFailed")}</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={cardHeadingClass}>{t("basics")}</h2>
            <p className="mt-1 text-xs text-[#676e78]">{t("startupHint")}</p>
          </div>
          {saved ? (
            <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-medium text-[#15803d]">
              {t("saved")}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-name"
            label={t("startupName")}
            value={draft.name}
            required
            error={fieldErrors.name}
            maxLength={255}
            onChange={(value) => setField("name", value)}
          />
          <EditableInfoField
            id="startup-website"
            label={t("website")}
            placeholder="ornek.com"
            value={draft.website ?? ""}
            error={fieldErrors.website}
            maxLength={255}
            onChange={(value) => setField("website", value)}
          />
        </div>

        <EditableInfoField
          id="startup-tagline"
          label={t("oneLiner")}
          placeholder={t("oneLinerPlaceholder")}
          value={draft.description ?? ""}
          error={fieldErrors.description}
          maxLength={5000}
          onChange={(value) => setField("description", value)}
        />
      </section>

      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("aboutStartup")}</h2>

        <EditableInfoField
          id="startup-problem"
          label={t("problem")}
          multiline
          value={draft.problem ?? ""}
          error={fieldErrors.problem}
          maxLength={5000}
          onChange={(value) => setField("problem", value)}
        />
        <EditableInfoField
          id="startup-solution"
          label={t("solution")}
          multiline
          value={draft.solution ?? ""}
          error={fieldErrors.solution}
          maxLength={5000}
          onChange={(value) => setField("solution", value)}
        />
        <EditableInfoField
          id="startup-current-solution"
          label={t("currentSolution")}
          multiline
          value={draft.currentSolution ?? ""}
          error={fieldErrors.currentSolution}
          maxLength={5000}
          onChange={(value) => setField("currentSolution", value)}
        />
        <EditableInfoField
          id="startup-target-user"
          label={t("targetUser")}
          multiline
          value={draft.targetUser ?? ""}
          error={fieldErrors.targetUser}
          maxLength={5000}
          onChange={(value) => setField("targetUser", value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-sector"
            label={t("sector")}
            value={draft.sector ?? ""}
            error={fieldErrors.sector}
            maxLength={255}
            onChange={(value) => setField("sector", value)}
          />
          <div className="rounded-xl border border-[#edf0f2] bg-[#fcfcfd] p-3.5">
            <label
              htmlFor="startup-maturity"
              className="block text-xs font-medium text-[#676e78]"
            >
              {t("stage")}
            </label>
            <select
              id="startup-maturity"
              value={draft.maturity ?? ""}
              onChange={(event) =>
                setField("maturity", event.target.value || null)
              }
              className="mt-1.5 w-full rounded-lg border border-[#e4e7ea] bg-white px-2.5 py-2 text-sm text-[#22262b] focus:border-[#e86f22] focus:outline-none"
            >
              <option value="">{t("notSpecified")}</option>
              {STARTUP_STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            {fieldErrors.maturity ? (
              <p className="mt-1 text-xs text-[#b91c1c]">
                {fieldErrors.maturity}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-founded-year"
            label={t("foundedYear")}
            placeholder="2026"
            inputMode="numeric"
            value={draft.foundedYear != null ? String(draft.foundedYear) : ""}
            error={fieldErrors.foundedYear}
            maxLength={4}
            onChange={(value) => setField("foundedYear", toFoundedYear(value))}
          />
          <div className="rounded-xl border border-[#edf0f2] bg-[#fcfcfd] p-3.5">
            <label
              htmlFor="startup-funding-stage"
              className="block text-xs font-medium text-[#676e78]"
            >
              {t("fundingStage")}
            </label>
            <select
              id="startup-funding-stage"
              value={draft.fundingStage ?? ""}
              onChange={(event) =>
                setField("fundingStage", toFundingStage(event.target.value))
              }
              className="mt-1.5 w-full rounded-lg border border-[#e4e7ea] bg-white px-2.5 py-2 text-sm text-[#22262b] focus:border-[#e86f22] focus:outline-none"
            >
              <option value="">{t("notSpecified")}</option>
              {Object.values(StartupFundingStage).map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            {fieldErrors.fundingStage ? (
              <p className="mt-1 text-xs text-[#b91c1c]">
                {fieldErrors.fundingStage}
              </p>
            ) : null}
          </div>
        </div>

        <EditableInfoField
          id="startup-program-level"
          label={t("programLevel")}
          value={draft.programLevel ?? ""}
          error={fieldErrors.programLevel}
          maxLength={255}
          onChange={(value) => setField("programLevel", value)}
        />
      </section>

      <section className={cardClass}>
        <h2 className={cardHeadingClass}>{t("supportAreas")}</h2>
        <EditableInfoChips
          label={t("supportAreas")}
          values={draft.supportAreas}
          error={fieldErrors.supportAreas}
          onChange={(values) => setField("supportAreas", values)}
        />

        {saveError ? (
          <p className="text-sm text-[#b91c1c]">{saveError}</p>
        ) : null}

        <div className="flex justify-end border-t border-[#f1f3f5] pt-4">
          <PrimaryButton onClick={save} disabled={!canSave}>
            {isSaving ? t("saving") : t("save")}
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
