"use client";

import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  EditableInfoChips,
  EditableInfoField,
} from "@/components/profile/editable-info-field";
import { useStartupProfile } from "@/hooks/use-startup-profile";
import { StartupFundingStage } from "@/interfaces/organization";
import { toFoundedYear, toFundingStage } from "@/lib/profile-validation";

/**
 * The signup wizard's second step, reopened after signup. Grouped the way that
 * step groups it — Temel bilgiler, Girişim hakkında, Destek alanları — so a
 * founder edits what they originally typed, in the shape they typed it.
 */
export function StartupProfileSection() {
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
        <h2 className={cardHeadingClass}>Startup bilgilerim</h2>
        <p className="text-sm text-[#676e78]">Bilgiler yükleniyor…</p>
      </section>
    );
  }

  if (loadError || !draft) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Startup bilgilerim</h2>
        <p className="text-sm text-[#b91c1c]">
          {loadError ?? "Bilgiler yüklenemedi."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={cardHeadingClass}>Temel bilgiler</h2>
            <p className="mt-1 text-xs text-[#676e78]">
              Kayıt sırasında girdiğin startup bilgileri.
            </p>
          </div>
          {saved ? (
            <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-medium text-[#15803d]">
              Kaydedildi
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-name"
            label="Startup adı"
            value={draft.name}
            required
            error={fieldErrors.name}
            maxLength={255}
            onChange={(value) => setField("name", value)}
          />
          <EditableInfoField
            id="startup-website"
            label="Web sitesi"
            placeholder="ornek.com"
            value={draft.website ?? ""}
            error={fieldErrors.website}
            maxLength={255}
            onChange={(value) => setField("website", value)}
          />
        </div>

        <EditableInfoField
          id="startup-tagline"
          label="Tek satırlık tanım"
          placeholder="Ne yaptığınızı bir cümlede anlatın."
          value={draft.description ?? ""}
          error={fieldErrors.description}
          maxLength={5000}
          onChange={(value) => setField("description", value)}
        />
      </section>

      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Girişim hakkında</h2>

        <EditableInfoField
          id="startup-problem"
          label="Hangi problemi çözüyorsunuz?"
          multiline
          value={draft.problem ?? ""}
          error={fieldErrors.problem}
          maxLength={5000}
          onChange={(value) => setField("problem", value)}
        />
        <EditableInfoField
          id="startup-solution"
          label="Çözümünüz"
          multiline
          value={draft.solution ?? ""}
          error={fieldErrors.solution}
          maxLength={5000}
          onChange={(value) => setField("solution", value)}
        />
        <EditableInfoField
          id="startup-current-solution"
          label="Mevcut çözüm"
          multiline
          value={draft.currentSolution ?? ""}
          error={fieldErrors.currentSolution}
          maxLength={5000}
          onChange={(value) => setField("currentSolution", value)}
        />
        <EditableInfoField
          id="startup-target-user"
          label="Hedef kullanıcı"
          multiline
          value={draft.targetUser ?? ""}
          error={fieldErrors.targetUser}
          maxLength={5000}
          onChange={(value) => setField("targetUser", value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-sector"
            label="Sektör"
            value={draft.sector ?? ""}
            error={fieldErrors.sector}
            maxLength={255}
            onChange={(value) => setField("sector", value)}
          />
          <EditableInfoField
            id="startup-maturity"
            label="Olgunluk"
            value={draft.maturity ?? ""}
            error={fieldErrors.maturity}
            maxLength={255}
            onChange={(value) => setField("maturity", value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-founded-year"
            label="Kuruluş yılı"
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
              Yatırım aşaması
            </label>
            <select
              id="startup-funding-stage"
              value={draft.fundingStage ?? ""}
              onChange={(event) =>
                setField("fundingStage", toFundingStage(event.target.value))
              }
              className="mt-1.5 w-full rounded-lg border border-[#e4e7ea] bg-white px-2.5 py-2 text-sm text-[#22262b] focus:border-[#e86f22] focus:outline-none"
            >
              <option value="">Belirtilmedi</option>
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
          label="Program seviyesi"
          value={draft.programLevel ?? ""}
          error={fieldErrors.programLevel}
          maxLength={255}
          onChange={(value) => setField("programLevel", value)}
        />
      </section>

      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Destek alanları</h2>
        <EditableInfoChips
          label="Destek alanları"
          values={draft.supportAreas}
          error={fieldErrors.supportAreas}
          onChange={(values) => setField("supportAreas", values)}
        />

        {saveError ? (
          <p className="text-sm text-[#b91c1c]">{saveError}</p>
        ) : null}

        <div className="flex justify-end border-t border-[#f1f3f5] pt-4">
          <PrimaryButton onClick={save} disabled={!canSave}>
            {isSaving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
