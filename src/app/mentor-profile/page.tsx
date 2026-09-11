"use client";

import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useAvailabilitySlotForm,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { formatSlotDateTime } from "@/lib/format";
import { programsMentorHasJoined } from "@/lib/meeting-targets";
import { initials as toInitials } from "@/lib/utils";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold leading-[23px]">{title}</h2>
        {action}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  const shown = rows.filter(([, value]) => Boolean(value));
  if (shown.length === 0)
    return <p className="text-xs text-[#858c96]">Henüz bilgi eklenmedi.</p>;
  return (
    <div className="space-y-3">
      {shown.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 text-[12.5px]">
          <span className="text-[#4a5059]">{label}</span>
          <b className="text-right font-medium">{value}</b>
        </div>
      ))}
    </div>
  );
}

function AvailabilityModal({
  slots,
  onClose,
}: {
  slots: MentorAvailabilitySlot[];
  onClose: () => void;
}) {
  const slotForm = useAvailabilitySlotForm();
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#22262b]/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="availability-title"
    >
      <section className="w-full max-w-[620px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.22)]">
        <header className="relative border-b border-[#eef0f3] px-6 pb-4 pt-5">
          <h2 id="availability-title" className="text-[20px] font-semibold">
            Müsaitliği düzenle
          </h2>
          <p className="mt-1 text-[11.5px] text-[#676e78]">
            Startuplar yalnızca açık bıraktığın saatlerde toplantı önerebilir.
          </p>
          <button
            onClick={onClose}
            aria-label="Düzenlemeyi kapat"
            className="absolute right-5 top-7"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase text-[#858c96]">
            Açık saatler
          </p>
          {slots.length === 0 ? (
            <p className="text-xs text-[#858c96]">Henüz açık saat eklemedin.</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-2.5 text-[12.5px]"
                >
                  <span>
                    {formatSlotDateTime(slot.startsAt)} · {slot.durationMinutes}{" "}
                    dk
                    {slot.booked ? " · Dolu" : ""}
                  </span>
                  <button
                    onClick={() => void slotForm.handleDeleteSlot(slot.id)}
                    disabled={slot.booked || slotForm.isDeleting}
                    className="rounded-full border border-[#d4d8dd] px-3 py-1.5 text-[11.5px] disabled:opacity-40"
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-[11.5px] text-[#676e78]">
              Başlangıç
              <input
                type="datetime-local"
                value={slotForm.slotForm.startsAt}
                onChange={(event) =>
                  slotForm.setSlotForm((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                className="mt-1 block rounded-lg border border-[#d4d8dd] px-3 py-2 text-[12.5px]"
              />
            </label>
            <label className="text-[11.5px] text-[#676e78]">
              Süre (dk)
              <input
                type="number"
                min={15}
                step={15}
                value={slotForm.slotForm.durationMinutes}
                onChange={(event) =>
                  slotForm.setSlotForm((current) => ({
                    ...current,
                    durationMinutes: Number(event.target.value),
                  }))
                }
                className="mt-1 block w-24 rounded-lg border border-[#d4d8dd] px-3 py-2 text-[12.5px]"
              />
            </label>
            <button
              onClick={() => void slotForm.handleAddSlot()}
              disabled={slotForm.isCreating}
              className="flex items-center gap-1 rounded-full border border-[#d4d8dd] px-3 py-2 text-[12.5px] text-[#26a4ff] disabled:opacity-50"
            >
              <Plus className="size-3" /> Saat ekle
            </button>
          </div>
          {slotForm.slotError ? (
            <p className="mt-3 text-[11.5px] text-[#a65a15]">
              {slotForm.slotError}
            </p>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t border-[#eef0f3] px-6 py-4">
          <p className="text-[11px] text-[#858c96]">
            Değişiklikler yaklaşan görüşmeleri etkilemez.
          </p>
          <button
            onClick={onClose}
            className="rounded-full bg-[#26a4ff] px-5 py-2.5 text-[12.5px] text-white"
          >
            Kapat
          </button>
        </footer>
      </section>
    </div>
  );
}

function ProfileBody({ profile }: { profile: MentorProfile }) {
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const form = useMentorProfileForm(profile);
  const slotsQuery = useMentorAvailabilitySlots();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const programsQuery = usePrograms();

  const slots = slotsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const accepted = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );
  const pending = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Pending,
  );
  const meetings = meetingsQuery.data ?? [];
  const session = useAppSession();
  const programs = programsMentorHasJoined(
    programsQuery.data ?? [],
    session?.userId,
  );
  const openSlots = slots.filter((slot) => !slot.booked);

  return (
    <>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-[18px]">
            <div className="grid size-[88px] shrink-0 place-items-center rounded-full bg-[#e6f1f8] text-[26px] font-semibold text-[#26a4ff]">
              {profile.initials || toInitials(profile.fullName)}
            </div>
            <div>
              <h1 className="text-[28px] font-semibold leading-[43px]">
                {profile.fullName}
              </h1>
              <p className="text-[13.5px] text-[#676e78]">
                {[profile.professionalTitle, profile.company]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                {programs.map((program) => (
                  <span
                    key={program.id}
                    className="rounded-full bg-[#f2f8fc] px-3 py-[5px] text-[#26a4ff]"
                  >
                    {program.name}
                  </span>
                ))}
                {profile.availabilityLabel ? (
                  <span className="rounded-full border border-[#cbebda] bg-[#eefaf3] px-3 py-[5px] text-[#0f7a4d]">
                    {profile.availabilityLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setAvailabilityOpen(true)}
              className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px] font-medium"
            >
              Müsaitliği düzenle
            </button>
            <button
              onClick={() => void form.handleSave()}
              disabled={form.isSaving}
              className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white disabled:bg-[#c9cdd2]"
            >
              Profili Kaydet
            </button>
          </div>
        </header>
        {form.saveError ? (
          <p className="mt-3 text-[12px] text-[#a65a15]">{form.saveError}</p>
        ) : null}
        <section className="mt-[22px] grid grid-cols-2 gap-4 rounded-xl bg-[#f2f8fc] px-6 py-[18px] md:grid-cols-4">
          {(
            [
              ["Aktif mentorluk", accepted.length],
              ["Bekleyen talep", pending.length],
              ["Toplam görüşme", meetings.length],
              ["Açık saat", openSlots.length],
            ] as [string, number][]
          ).map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#858c96]">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </section>
        <div className="mt-[22px] grid items-start gap-6 lg:grid-cols-[minmax(0,804px)_400px]">
          <div className="space-y-[18px]">
            <Card title="Hakkında">
              <label className="block text-[11.5px] text-[#676e78]">
                Ünvan
                <input
                  value={form.form.professionalTitle}
                  onChange={(event) =>
                    form.updateField("professionalTitle", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                />
              </label>
              <label className="mt-3 block text-[11.5px] text-[#676e78]">
                Şirket
                <input
                  value={form.form.company}
                  onChange={(event) =>
                    form.updateField("company", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                />
              </label>
            </Card>
            <Card title="Mentorluk konuları">
              <div className="flex flex-wrap gap-2">
                {form.form.specialties.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Henüz konu eklenmedi.
                  </p>
                ) : (
                  form.form.specialties.map((topic) => (
                    <span
                      key={topic}
                      className="flex items-center gap-1 rounded-full bg-[#f2f8fc] px-3 py-[5px] text-xs font-medium text-[#26a4ff]"
                    >
                      {topic}
                      <button
                        onClick={() => form.removeSpecialty(topic)}
                        aria-label={`${topic} konusunu kaldır`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={form.specialtyInput}
                  onChange={(event) =>
                    form.setSpecialtyInput(event.target.value)
                  }
                  placeholder="Konu ekle"
                  className="min-w-0 flex-1 rounded-lg border border-[#d4d8dd] px-3 py-2 text-[12.5px]"
                />
                <button
                  onClick={form.addSpecialty}
                  className="rounded-full border border-[#d4d8dd] px-3 py-2 text-[12.5px] text-[#26a4ff]"
                >
                  Ekle
                </button>
              </div>
            </Card>
            <Card title="Nasıl çalışıyorum">
              <Facts
                rows={[
                  ["Mentorluk tarzı", form.form.mentoringStyle],
                  ["Deneyim", form.form.experienceLevel],
                  ["Sektör", form.form.sectorExperience],
                  ["Çalıştığı aşamalar", form.form.startupStages],
                ]}
              />
            </Card>
            <Card title="Mentorluk geçmişi">
              {accepted.length === 0 ? (
                <p className="text-xs text-[#858c96]">
                  Henüz kabul edilmiş bir mentorluk yok.
                </p>
              ) : (
                <div className="space-y-3">
                  {accepted.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                    >
                      <div>
                        <p className="text-[13px] font-medium">
                          {request.organizationName ?? request.requesterName}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                          {request.supportArea}
                        </p>
                      </div>
                      <span className="text-[11.5px] text-[#676e78]">
                        {formatSlotDateTime(request.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <aside className="space-y-[18px]">
            <Card
              title="Müsaitlik"
              action={
                <button
                  onClick={() => setAvailabilityOpen(true)}
                  className="text-[12.5px] font-medium text-[#26a4ff]"
                >
                  Düzenle
                </button>
              }
            >
              <p className="text-xs text-[#676e78]">Açık görüşme saatleri</p>
              <div className="mt-4 space-y-3">
                {slotsQuery.isLoading ? (
                  <p className="text-xs text-[#858c96]">Yükleniyor...</p>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Tanımlı açık saat yok.
                  </p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex justify-between text-[12.5px]"
                    >
                      <span className="text-[#4a5059]">
                        {formatSlotDateTime(slot.startsAt)}
                      </span>
                      <span
                        className={
                          slot.booked
                            ? "font-medium text-[#858c96]"
                            : "font-medium"
                        }
                      >
                        {slot.booked ? "Dolu" : `${slot.durationMinutes} dk`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card title="Görüşme tercihleri">
              <Facts
                rows={[
                  ["Format", form.form.meetingMode],
                  ["Yanıt süresi", form.form.responseTimeLabel],
                  ["İletişim", form.form.communicationPreference],
                  ["Uygunluk", form.form.availabilityLabel],
                ]}
              />
            </Card>
            <Card title="Programlar">
              {programs.length === 0 ? (
                <p className="text-xs text-[#858c96]">
                  Katıldığınız bir program yok.
                </p>
              ) : (
                <div className="space-y-3">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                    >
                      <p className="text-[13px] font-medium">{program.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                        {program.coordinatorName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </main>
      {availabilityOpen ? (
        <AvailabilityModal
          slots={slots}
          onClose={() => setAvailabilityOpen(false)}
        />
      ) : null}
    </>
  );
}

export default function MentorProfilePage() {
  const profileQuery = useMentorProfile();

  return (
    <AppShell mentorHome>
      {profileQuery.isLoading ? (
        <p className="p-10 text-center text-sm text-[#858c96]">Yükleniyor...</p>
      ) : profileQuery.error || !profileQuery.data ? (
        <p className="p-10 text-center text-sm text-[#a65a15]">
          Mentor profili yüklenemedi.
        </p>
      ) : (
        <ProfileBody profile={profileQuery.data} />
      )}
    </AppShell>
  );
}
