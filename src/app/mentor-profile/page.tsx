"use client";

import { X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { AvailabilityDialog } from "@/components/mentor-profile/availability-dialog";
import {
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorProfileOverview } from "@/hooks/use-mentor-profile-overview";
import type { MentorProfile } from "@/interfaces/mentor";
import type { LabelValue } from "@/lib/mentor-profile-overview";
import { initials as toInitials } from "@/lib/utils";

type ProfileForm = ReturnType<typeof useMentorProfileForm>;
type TextField = Parameters<ProfileForm["updateField"]>[0];

const inputClass =
  "mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]";
const emptyClass = "text-xs text-[#858c96]";

function Card({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${title} düzenle`}
            className="text-[12.5px] font-medium text-[#26a4ff]"
          >
            Düzenle
          </button>
        ) : null}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: LabelValue[] }) {
  return (
    <dl className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 text-[12.5px]"
        >
          <dt className="text-[#4a5059]">{row.label}</dt>
          <dd className="text-right font-medium text-[#22262b]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TextInput({
  form,
  field,
  label,
  multiline = false,
}: {
  form: ProfileForm;
  field: TextField;
  label: string;
  multiline?: boolean;
}) {
  const value = form.form[field];
  return (
    <label className="block text-[11.5px] text-[#676e78]">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => form.updateField(field, event.target.value)}
          className={`${inputClass} min-h-24`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => form.updateField(field, event.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
}

function ProfileBody({ profile }: { profile: MentorProfile }) {
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const form = useMentorProfileForm(profile);
  const overview = useMentorProfileOverview(profile);
  const editing = form.isEditing;
  const editSection = editing ? undefined : form.startEditing;

  return (
    <>
      <main className="mx-auto w-full max-w-[1276px] px-4 pb-[72px] pt-3 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-[18px]">
            <div className="grid size-[88px] shrink-0 place-items-center rounded-full bg-[#e6f1f8] text-[26px] font-semibold text-[#26a4ff]">
              {profile.initials || toInitials(profile.fullName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-[1.4] text-[#22262b]">
                {profile.fullName}
              </h1>
              {overview.subtitle ? (
                <p className="text-[13.5px] text-[#676e78]">
                  {overview.subtitle}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                {overview.programs.map((program) => (
                  <span
                    key={program.id}
                    className="rounded-full bg-[#eaf6ff] px-3 py-[5px] text-[#1a7fd0]"
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
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setAvailabilityOpen(true)}
              className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px] font-medium"
            >
              Müsaitliği düzenle
            </button>
            {editing ? (
              <button
                type="button"
                onClick={form.cancelEditing}
                disabled={form.isSaving}
                className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px] font-medium disabled:opacity-50"
              >
                Vazgeç
              </button>
            ) : null}
            <button
              type="button"
              onClick={
                editing ? () => void form.saveAndFinish() : form.startEditing
              }
              disabled={form.isSaving}
              className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white disabled:bg-[#c9cdd2]"
            >
              {!editing
                ? "Profili düzenle"
                : form.isSaving
                  ? "Kaydediliyor…"
                  : "Kaydet"}
            </button>
          </div>
        </header>
        {form.saveError ? (
          <p role="alert" className="mt-3 text-[12px] text-[#a65a15]">
            {form.saveError}
          </p>
        ) : null}

        <section
          aria-label="Mentorluk özeti"
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {overview.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#dbe9f4] bg-white px-4 py-3"
            >
              <p className="text-[11px] text-[#858c96]">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-[#22262b]">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-[18px]">
            <Card title="Hakkında" onEdit={editSection}>
              {editing ? (
                <div className="space-y-3">
                  <TextInput
                    form={form}
                    field="about"
                    label="Hakkında"
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      form={form}
                      field="professionalTitle"
                      label="Ünvan"
                    />
                    <TextInput form={form} field="company" label="Şirket" />
                    <TextInput
                      form={form}
                      field="experienceLevel"
                      label="Deneyim"
                    />
                    <TextInput
                      form={form}
                      field="availabilityLabel"
                      label="Uygunluk etiketi"
                    />
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-[13px] leading-5 text-[#4a5059]">
                  {form.form.about || "Henüz hakkında bilgisi eklenmedi."}
                </p>
              )}
            </Card>

            <Card title="Mentorluk konuları" onEdit={editSection}>
              <div className="flex flex-wrap gap-2">
                {form.form.specialties.length === 0 ? (
                  <p className={emptyClass}>Henüz konu eklenmedi.</p>
                ) : (
                  form.form.specialties.map((topic) => (
                    <span
                      key={topic}
                      className="flex items-center gap-1 rounded-full bg-[#f2f8fc] px-3 py-[5px] text-xs font-medium text-[#1a7fd0]"
                    >
                      {topic}
                      {editing ? (
                        <button
                          type="button"
                          onClick={() => form.removeSpecialty(topic)}
                          aria-label={`${topic} konusunu kaldır`}
                        >
                          <X className="size-3" />
                        </button>
                      ) : null}
                    </span>
                  ))
                )}
              </div>
              {editing ? (
                <div className="mt-3 flex gap-2">
                  <input
                    aria-label="Yeni konu"
                    value={form.specialtyInput}
                    onChange={(event) =>
                      form.setSpecialtyInput(event.target.value)
                    }
                    placeholder="Konu ekle"
                    className="min-w-0 flex-1 rounded-lg border border-[#d4d8dd] px-3 py-2 text-[12.5px]"
                  />
                  <button
                    type="button"
                    onClick={form.addSpecialty}
                    className="rounded-full border border-[#d4d8dd] px-3 py-2 text-[12.5px] text-[#26a4ff]"
                  >
                    Ekle
                  </button>
                </div>
              ) : null}
            </Card>

            <Card title="Nasıl çalışıyorum" onEdit={editSection}>
              {editing ? (
                <div className="space-y-3">
                  <TextInput
                    form={form}
                    field="mentoringStyle"
                    label="Çalışma şekli (her satır bir madde)"
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      form={form}
                      field="sectorExperience"
                      label="Sektör deneyimi"
                    />
                    <TextInput
                      form={form}
                      field="startupStages"
                      label="Çalıştığı aşamalar"
                    />
                  </div>
                </div>
              ) : overview.workingStyle.length === 0 ? (
                <p className={emptyClass}>Henüz bilgi eklenmedi.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.workingStyle.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-[13px] leading-5 text-[#4a5059]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-[#26a4ff]"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {editing ? (
              <Card title="Geçmiş roller">
                <div className="space-y-3">
                  {form.form.experiences.map((experience, index) => (
                    <fieldset
                      key={index}
                      className="grid gap-2 rounded-lg border border-[#e4e7ea] p-3 sm:grid-cols-2"
                    >
                      <legend className="sr-only">{index + 1}. deneyim</legend>
                      {(
                        [
                          ["title", "Ünvan"],
                          ["organization", "Kurum"],
                          ["period", "Dönem"],
                          ["summary", "Açıklama"],
                        ] as const
                      ).map(([field, label]) => (
                        <label
                          key={field}
                          className="block text-[11.5px] text-[#676e78]"
                        >
                          {label}
                          <input
                            value={experience[field]}
                            onChange={(event) =>
                              form.updateExperience(
                                index,
                                field,
                                event.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => form.removeExperience(index)}
                        className="justify-self-start text-xs text-[#a65a15]"
                      >
                        Deneyimi kaldır
                      </button>
                    </fieldset>
                  ))}
                  {form.canAddExperience ? (
                    <button
                      type="button"
                      onClick={form.addExperience}
                      className="rounded-full border border-[#d4d8dd] px-3 py-2 text-[12.5px] text-[#26a4ff]"
                    >
                      Deneyim ekle
                    </button>
                  ) : null}
                </div>
              </Card>
            ) : null}

            <Card title="Mentorluk geçmişi">
              {overview.history.length === 0 ? (
                <p className={emptyClass}>
                  Henüz kabul edilmiş bir mentorluk yok.
                </p>
              ) : (
                <ul className="space-y-2">
                  {overview.history.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                    >
                      <p className="text-[13px] font-medium text-[#22262b]">
                        {row.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                        {row.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <aside className="space-y-[18px]">
            <Card title="Müsaitlik" onEdit={() => setAvailabilityOpen(true)}>
              <p className="text-xs text-[#676e78]">
                Tekrarlayan haftalık uygunluk
              </p>
              <div className="mt-4">
                {overview.isAvailabilityLoading ? (
                  <p className={emptyClass}>Yükleniyor...</p>
                ) : overview.weeklyAvailability.length === 0 ? (
                  <p className={emptyClass}>Tanımlı haftalık saat yok.</p>
                ) : (
                  <Rows rows={overview.weeklyAvailability} />
                )}
              </div>
              {overview.capacityLabel ? (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f2f8fc] px-3 py-2.5 text-[12.5px]">
                  <span className="text-[#4a5059]">Eş zamanlı mentorluk</span>
                  <span className="font-medium text-[#1a7fd0]">
                    {overview.capacityLabel}
                  </span>
                </div>
              ) : null}
            </Card>

            <Card title="Görüşme tercihleri" onEdit={editSection}>
              {editing ? (
                <div className="space-y-3">
                  <TextInput form={form} field="meetingMode" label="Format" />
                  <TextInput
                    form={form}
                    field="responseTimeLabel"
                    label="Yanıt süresi"
                  />
                  <TextInput
                    form={form}
                    field="communicationPreference"
                    label="İletişim"
                  />
                </div>
              ) : overview.preferences.length === 0 ? (
                <p className={emptyClass}>Henüz bilgi eklenmedi.</p>
              ) : (
                <Rows rows={overview.preferences} />
              )}
            </Card>

            <Card title="Programlar">
              {overview.programs.length === 0 ? (
                <p className={emptyClass}>Katıldığınız bir program yok.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.programs.map((program) => (
                    <li
                      key={program.id}
                      className="rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                    >
                      <p className="text-[13px] font-medium text-[#22262b]">
                        {program.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                        Koordinatör: {program.coordinatorName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </main>
      {availabilityOpen ? (
        <AvailabilityDialog onClose={() => setAvailabilityOpen(false)} />
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
