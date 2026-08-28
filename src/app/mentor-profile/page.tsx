"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import {
  useAvailabilitySlotForm,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import type {
  MentorProfile,
  UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import { formatDateTime } from "@/lib/utils";

const FIELDS: Array<{
  key: keyof UpdateMentorProfilePayload;
  label: string;
}> = [
  { key: "professionalTitle", label: "Ünvan" },
  { key: "company", label: "Şirket" },
  { key: "availabilityLabel", label: "Müsaitlik" },
  { key: "responseTimeLabel", label: "Yanıt Süresi" },
  { key: "meetingMode", label: "Görüşme Biçimi" },
  { key: "communicationPreference", label: "İletişim Tercihi" },
  { key: "mentoringStyle", label: "Mentorluk Tarzı" },
  { key: "fitLabel", label: "Uyum Seviyesi" },
  { key: "experienceLevel", label: "Deneyim Alanı" },
  { key: "sectorExperience", label: "Sektör Deneyimi" },
  { key: "startupStages", label: "Girişim Aşamaları" },
];

function ProfileForm({ profile }: { profile: MentorProfile }) {
  const {
    form,
    specialtyInput,
    setSpecialtyInput,
    saveError,
    saveSuccess,
    isSaving,
    updateField,
    addSpecialty,
    removeSpecialty,
    handleSave,
  } = useMentorProfileForm(profile);

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-zinc-700">
              {label}
            </label>
            <input
              type="text"
              value={form[key] as string}
              onChange={(event) => updateField(key, event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-zinc-700">
          Uzmanlık Alanları
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.specialties.map((specialty) => (
            <span
              key={specialty}
              className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
            >
              {specialty}
              <button
                type="button"
                aria-label={`${specialty} kaldır`}
                onClick={() => removeSpecialty(specialty)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={specialtyInput}
            onChange={(event) => setSpecialtyInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSpecialty();
              }
            }}
            placeholder="Yeni uzmanlık ekle..."
            className="flex-1 rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
          />
          <SecondaryButton onClick={addSpecialty}>Ekle</SecondaryButton>
        </div>
      </div>

      {saveError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {saveError}
        </p>
      ) : null}
      {saveSuccess ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          Profil güncellendi.
        </p>
      ) : null}

      <div className="mt-4">
        <PrimaryButton disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? "Kaydediliyor..." : "Profili Kaydet"}
        </PrimaryButton>
      </div>
    </>
  );
}

export default function MentorProfilePage() {
  const profileQuery = useMentorProfile();
  const availabilityQuery = useMentorAvailabilitySlots();
  const {
    slotForm,
    setSlotForm,
    slotError,
    isCreating,
    isDeleting,
    handleAddSlot,
    handleDeleteSlot,
  } = useAvailabilitySlotForm();

  const slots = availabilityQuery.data ?? [];

  return (
    <AppShell title="Mentor Profilim" backHref="/mentor-dashboard">
      <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 pb-12 pt-8 sm:px-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-bold text-zinc-900">Profil Bilgileri</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Bu bilgiler girişimcilere mentor eşleştirmelerinde gösterilir.
          </p>

          {profileQuery.isLoading ? (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Yükleniyor...
            </p>
          ) : profileQuery.error || !profileQuery.data ? (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              Could not load the profile.
            </p>
          ) : (
            <ProfileForm profile={profileQuery.data} />
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-bold text-zinc-900">
            Müsaitlik Zaman Dilimleri
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Girişimcilere sunulacak uygun görüşme saatlerinizi yönetin.
          </p>

          {availabilityQuery.isLoading ? (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Yükleniyor...
            </p>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-xs text-zinc-500">
              Henüz eklenmiş bir zaman dilimi yok.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {slots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 text-xs"
                >
                  <span>
                    📅 {formatDateTime(slot.startsAt)} ({slot.durationMinutes}{" "}
                    dk)
                    {slot.booked ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                        Dolu
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    disabled={slot.booked || isDeleting}
                    onClick={() => void handleDeleteSlot(slot.id)}
                    className="text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700">
                Tarih ve Saat
              </label>
              <input
                type="datetime-local"
                value={slotForm.startsAt}
                onChange={(event) =>
                  setSlotForm((previous) => ({
                    ...previous,
                    startsAt: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700">
                Süre (dk)
              </label>
              <input
                type="number"
                min={1}
                value={slotForm.durationMinutes}
                onChange={(event) =>
                  setSlotForm((previous) => ({
                    ...previous,
                    durationMinutes: Number(event.target.value),
                  }))
                }
                className="mt-1 w-24 rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <PrimaryButton
              disabled={isCreating}
              onClick={() => void handleAddSlot()}
            >
              {isCreating ? "Ekleniyor..." : "Ekle"}
            </PrimaryButton>
          </div>
          {slotError ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {slotError}
            </p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
