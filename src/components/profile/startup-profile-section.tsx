"use client";

import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  EditableInfoChips,
  EditableInfoField,
} from "@/components/profile/editable-info-field";
import { useStartupProfile } from "@/hooks/use-startup-profile";

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
            onChange={(value) => setField("name", value)}
          />
          <EditableInfoField
            id="startup-website"
            label="Web sitesi"
            placeholder="ornek.com"
            value={draft.website ?? ""}
            onChange={(value) => setField("website", value)}
          />
        </div>

        <EditableInfoField
          id="startup-tagline"
          label="Tek satırlık tanım"
          placeholder="Ne yaptığınızı bir cümlede anlatın."
          value={draft.description ?? ""}
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
          onChange={(value) => setField("problem", value)}
        />
        <EditableInfoField
          id="startup-solution"
          label="Çözümünüz"
          multiline
          value={draft.solution ?? ""}
          onChange={(value) => setField("solution", value)}
        />
        <EditableInfoField
          id="startup-current-solution"
          label="Mevcut çözüm"
          multiline
          value={draft.currentSolution ?? ""}
          onChange={(value) => setField("currentSolution", value)}
        />
        <EditableInfoField
          id="startup-target-user"
          label="Hedef kullanıcı"
          multiline
          value={draft.targetUser ?? ""}
          onChange={(value) => setField("targetUser", value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <EditableInfoField
            id="startup-sector"
            label="Sektör"
            value={draft.sector ?? ""}
            onChange={(value) => setField("sector", value)}
          />
          <EditableInfoField
            id="startup-maturity"
            label="Olgunluk"
            value={draft.maturity ?? ""}
            onChange={(value) => setField("maturity", value)}
          />
        </div>

        <EditableInfoField
          id="startup-program-level"
          label="Program seviyesi"
          value={draft.programLevel ?? ""}
          onChange={(value) => setField("programLevel", value)}
        />
      </section>

      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Destek alanları</h2>
        <EditableInfoChips
          label="Destek alanları"
          values={draft.supportAreas}
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
