"use client";

import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  EditableInfoChips,
  EditableInfoField,
} from "@/components/profile/editable-info-field";
import { usePersonalProfile } from "@/hooks/use-personal-profile";

/**
 * The signup wizard's first step, reopened after signup. Until now these fields
 * were write-only: bio, LinkedIn and expertise were collected, stored by V33,
 * and never shown again.
 */
export function PersonalProfileSection() {
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
  } = usePersonalProfile();

  if (isLoading) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Kişisel bilgilerim</h2>
        <p className="text-sm text-[#676e78]">Bilgiler yükleniyor…</p>
      </section>
    );
  }

  if (loadError || !draft) {
    return (
      <section className={cardClass}>
        <h2 className={cardHeadingClass}>Kişisel bilgilerim</h2>
        <p className="text-sm text-[#b91c1c]">
          {loadError ?? "Bilgiler yüklenemedi."}
        </p>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={cardHeadingClass}>Kişisel bilgilerim</h2>
          <p className="mt-1 text-xs text-[#676e78]">
            Kayıt sırasında girdiğin bilgiler.
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
          id="profile-full-name"
          label="Ad soyad"
          value={draft.fullName}
          onChange={(value) => setField("fullName", value)}
        />
        <EditableInfoField
          id="profile-job-title"
          label="Rol"
          placeholder="Startup'taki rolün"
          value={draft.jobTitle ?? ""}
          onChange={(value) => setField("jobTitle", value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EditableInfoField
          id="profile-phone"
          label="Telefon"
          value={draft.phone ?? ""}
          onChange={(value) => setField("phone", value)}
        />
        <EditableInfoField
          id="profile-linkedin"
          label="LinkedIn"
          placeholder="linkedin.com/in/…"
          value={draft.linkedinUrl ?? ""}
          onChange={(value) => setField("linkedinUrl", value)}
        />
      </div>

      <EditableInfoField
        id="profile-bio"
        label="Kısa tanıtım"
        multiline
        placeholder="Kendini birkaç cümleyle anlat."
        value={draft.bio ?? ""}
        onChange={(value) => setField("bio", value)}
      />

      <EditableInfoChips
        label="Uzmanlık alanları"
        values={draft.expertise}
        onChange={(values) => setField("expertise", values)}
      />

      {saveError ? <p className="text-sm text-[#b91c1c]">{saveError}</p> : null}

      <div className="flex justify-end border-t border-[#f1f3f5] pt-4">
        <PrimaryButton onClick={save} disabled={!canSave}>
          {isSaving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </PrimaryButton>
      </div>
    </section>
  );
}
