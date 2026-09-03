"use client";

import { EditableChips } from "@/components/common/editable-chips";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  usePersonalProfile,
  type PersonalProfileField,
} from "@/hooks/use-personal-profile";

/**
 * The signup wizard's first step, reopened after signup. Until now these fields
 * were write-only: bio, LinkedIn and expertise were collected, stored by V33,
 * and never shown again.
 */
const TEXT_FIELDS: {
  field: PersonalProfileField;
  label: string;
  multiline?: boolean;
}[] = [
  { field: "fullName", label: "Ad soyad" },
  { field: "jobTitle", label: "Rol" },
  { field: "phone", label: "Telefon" },
  { field: "bio", label: "Kısa tanıtım", multiline: true },
  { field: "linkedinUrl", label: "LinkedIn" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#171717] outline-none focus:border-[#e86f22]";

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

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#364153]">
          Kişisel bilgilerim
        </h2>
        {saved ? (
          <span className="text-xs font-semibold text-[#15803d]">
            Kaydedildi
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-[#6a7282]">
        Kayıt sırasında girdiğin bilgiler. İstediğin zaman güncelleyebilirsin.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-[#6a7282]">Bilgiler yükleniyor…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-[#b91c1c]">{loadError}</p>
      ) : !draft ? null : (
        <div className="mt-4 space-y-4">
          {TEXT_FIELDS.map(({ field, label, multiline }) => (
            <label key={field} className="block">
              <span className="text-xs font-medium text-[#6a7282]">
                {label}
              </span>
              {multiline ? (
                <textarea
                  className={`${INPUT_CLASS} mt-1 min-h-20`}
                  value={draft[field] ?? ""}
                  onChange={(event) => setField(field, event.target.value)}
                />
              ) : (
                <input
                  className={`${INPUT_CLASS} mt-1`}
                  value={draft[field] ?? ""}
                  onChange={(event) => setField(field, event.target.value)}
                />
              )}
            </label>
          ))}

          <EditableChips
            label="Uzmanlık alanları"
            values={draft.expertise}
            onChange={(values) => setField("expertise", values)}
          />

          {saveError ? (
            <p className="text-sm text-[#b91c1c]">{saveError}</p>
          ) : null}

          <PrimaryButton onClick={save} disabled={!canSave}>
            {isSaving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </PrimaryButton>
        </div>
      )}
    </section>
  );
}
