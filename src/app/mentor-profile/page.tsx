"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import {
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useUpdateMentorProfile,
} from "@/hooks/use-mentor-profile";
import type {
  MentorProfile,
  UpdateMentorProfilePayload,
} from "@/interfaces/mentor";

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSlotStart() {
  // The backend rejects slots that aren't strictly in the future, so
  // default a bit ahead of "now" rather than exactly at it — otherwise
  // accepting the default value as-is fails by the time the request lands.
  return toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

function ProfileForm({ profile }: { profile: MentorProfile }) {
  const updateProfileMutation = useUpdateMentorProfile();
  const [form, setForm] = useState<UpdateMentorProfilePayload>(() => ({
    professionalTitle: profile.professionalTitle,
    company: profile.company,
    availabilityLabel: profile.availabilityLabel,
    responseTimeLabel: profile.responseTimeLabel,
    meetingMode: profile.meetingMode,
    communicationPreference: profile.communicationPreference,
    mentoringStyle: profile.mentoringStyle,
    fitLabel: profile.fitLabel,
    experienceLevel: profile.experienceLevel,
    sectorExperience: profile.sectorExperience,
    startupStages: profile.startupStages,
    specialties: profile.specialties,
  }));
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateField = (
    key: keyof UpdateMentorProfilePayload,
    value: string,
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value || form.specialties.includes(value)) return;
    setForm((previous) => ({
      ...previous,
      specialties: [...previous.specialties, value],
    }));
    setSpecialtyInput("");
  };

  const removeSpecialty = (value: string) => {
    setForm((previous) => ({
      ...previous,
      specialties: previous.specialties.filter((item) => item !== value),
    }));
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateProfileMutation.mutateAsync(form);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Profil kaydedilemedi.",
      );
    }
  };

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
        <PrimaryButton
          disabled={updateProfileMutation.isPending}
          onClick={() => void handleSave()}
        >
          {updateProfileMutation.isPending
            ? "Kaydediliyor..."
            : "Profili Kaydet"}
        </PrimaryButton>
      </div>
    </>
  );
}

export default function MentorProfilePage() {
  const profileQuery = useMentorProfile();
  const availabilityQuery = useMentorAvailabilitySlots();
  const createSlotMutation = useCreateAvailabilitySlot();
  const deleteSlotMutation = useDeleteAvailabilitySlot();

  const [slotForm, setSlotForm] = useState({
    startsAt: defaultSlotStart(),
    durationMinutes: 60,
  });
  const [slotError, setSlotError] = useState("");

  const handleAddSlot = async () => {
    setSlotError("");
    try {
      await createSlotMutation.mutateAsync({
        startsAt: new Date(slotForm.startsAt).toISOString(),
        durationMinutes: slotForm.durationMinutes,
      });
      setSlotForm({
        startsAt: defaultSlotStart(),
        durationMinutes: 60,
      });
    } catch (error) {
      setSlotError(
        error instanceof Error ? error.message : "Zaman dilimi eklenemedi.",
      );
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlotMutation.mutateAsync(slotId);
    } catch {
      // surfaced via deleteSlotMutation.error below
    }
  };

  const slots = availabilityQuery.data ?? [];

  return (
    <AppShell title="Mentor Profilim" backHref="/mentor-home">
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
              Profil yüklenemedi.
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
                    disabled={slot.booked || deleteSlotMutation.isPending}
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
              disabled={createSlotMutation.isPending}
              onClick={() => void handleAddSlot()}
            >
              {createSlotMutation.isPending ? "Ekleniyor..." : "Ekle"}
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
