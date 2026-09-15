"use client";

import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useAvailabilitySettingsForm,
  useMentorAvailabilitySettings,
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import { type MentorProfile, WEEKDAY_LABELS } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { formatSlotDateTime } from "@/lib/format";
import { programsMentorHasJoined } from "@/lib/meeting-targets";
import {
  AVAILABILITY_NUMBER_FIELDS,
  exceptionLabel,
  toTimeInput,
} from "@/lib/mentor-availability";
import { initials as toInitials } from "@/lib/utils";

const smallInputClass = "rounded-lg border border-[#d4d8dd] px-2 py-1 text-xs";
const sectionLabelClass = "text-[10px] font-semibold uppercase text-[#858c96]";

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

function AvailabilityModal({ onClose }: { onClose: () => void }) {
  const availability = useAvailabilitySettingsForm(onClose);
  const { draft } = availability;

  return (
    <ModalDialog
      labelledBy="availability-title"
      onClose={onClose}
      panelClassName="w-full max-w-[620px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.22)] outline-none"
    >
      <header className="relative border-b border-[#eef0f3] px-6 pb-4 pt-5">
        <h2 id="availability-title" className="text-[20px] font-semibold">
          Müsaitliği düzenle
        </h2>
        <p className="mt-1 text-[11.5px] text-[#676e78]">
          Startuplar yalnızca açık bıraktığın saatlerde toplantı önerebilir.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Düzenlemeyi kapat"
          className="absolute right-5 top-7"
        >
          <X className="size-5" strokeWidth={1.5} />
        </button>
      </header>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
        {availability.loadError ? (
          <p role="alert" className="text-xs text-[#a65a15]">
            {availability.loadError}
          </p>
        ) : !draft ? (
          <p className="text-xs text-[#858c96]">Yükleniyor...</p>
        ) : (
          <>
            <section>
              <p className={`mb-3 ${sectionLabelClass}`}>Haftalık uygunluk</p>
              <div className="space-y-2">
                {availability.days.map(({ day, label, ranges }) => (
                  <div
                    key={day}
                    className="rounded-xl border border-[#e4e7ea] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 text-[13px]">
                        <input
                          type="checkbox"
                          aria-label={`${label} uygun`}
                          checked={ranges.length > 0}
                          onChange={() => availability.toggleDay(day)}
                        />
                        {label}
                      </label>
                      {ranges.length === 0 ? (
                        <span className="text-xs text-[#858c96]">Kapalı</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => availability.addRange(day)}
                          aria-label={`${label} için saat aralığı ekle`}
                          className="flex items-center gap-1 text-xs font-medium text-[#26a4ff]"
                        >
                          <Plus className="size-3" /> Aralık ekle
                        </button>
                      )}
                    </div>
                    {ranges.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {ranges.map((range, index) => {
                          const name = `${label} ${index + 1}. aralık`;
                          return (
                            <div
                              key={range.key}
                              className="flex items-center justify-end gap-2"
                            >
                              <input
                                type="time"
                                aria-label={`${name} başlangıç`}
                                value={range.startTime}
                                onChange={(event) =>
                                  availability.updateRange(
                                    range.key,
                                    "startTime",
                                    event.target.value,
                                  )
                                }
                                className={`w-24 ${smallInputClass}`}
                              />
                              <span className="text-xs text-[#858c96]">–</span>
                              <input
                                type="time"
                                aria-label={`${name} bitiş`}
                                value={range.endTime}
                                onChange={(event) =>
                                  availability.updateRange(
                                    range.key,
                                    "endTime",
                                    event.target.value,
                                  )
                                }
                                className={`w-24 ${smallInputClass}`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  availability.removeRange(range.key)
                                }
                                aria-label={`${name} kaldır`}
                                className="grid size-6 place-items-center rounded-md text-[#858c96] hover:bg-[#f3f4f6]"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <p className={sectionLabelClass}>Kapasite ve varsayılanlar</p>
              {AVAILABILITY_NUMBER_FIELDS.map(({ field, label, min, max }) => (
                <label
                  key={field}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span>{label}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    value={draft[field]}
                    onChange={(event) =>
                      availability.setNumber(field, event.target.value)
                    }
                    className="w-24 rounded-lg border border-[#d4d8dd] px-3 py-2 text-right text-xs"
                  />
                </label>
              ))}
            </section>
            <section>
              <p className={`mb-3 ${sectionLabelClass}`}>
                Uygun olmadığın tarihler
              </p>
              <div className="flex flex-wrap gap-2">
                {draft.exceptions.map((item, index) => {
                  const text = exceptionLabel(item);
                  return (
                    <button
                      key={`${item.startsOn}-${item.endsOn}`}
                      type="button"
                      onClick={() => availability.removeException(index)}
                      aria-label={`${text} tarihini kaldır`}
                      className="rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-3 py-1.5 text-xs"
                    >
                      {text} ×
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                  type="date"
                  aria-label="Başlangıç tarihi"
                  value={availability.exception.startsOn}
                  onChange={(event) =>
                    availability.setExceptionField(
                      "startsOn",
                      event.target.value,
                    )
                  }
                  className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                />
                <input
                  type="date"
                  aria-label="Bitiş tarihi"
                  value={availability.exception.endsOn}
                  onChange={(event) =>
                    availability.setExceptionField("endsOn", event.target.value)
                  }
                  className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                />
                <input
                  aria-label="İstisna nedeni"
                  value={availability.exception.reason}
                  onChange={(event) =>
                    availability.setExceptionField("reason", event.target.value)
                  }
                  placeholder="Neden (isteğe bağlı)"
                  className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={availability.addException}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-[#26a4ff]"
              >
                <Plus className="size-3" /> Tarih ekle
              </button>
            </section>
          </>
        )}
        {availability.error ? (
          <p role="alert" className="text-[12px] text-[#a65a15]">
            {availability.error}
          </p>
        ) : null}
      </div>
      <footer className="flex items-center justify-between border-t border-[#eef0f3] px-6 py-4">
        <p className="text-[11px] text-[#858c96]">
          Değişiklikler yaklaşan görüşmeleri etkilemez.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d4d8dd] px-5 py-2.5 text-[12.5px]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void availability.save()}
            disabled={!draft || availability.isSaving}
            className="rounded-full bg-[#26a4ff] px-5 py-2.5 text-[12.5px] text-white disabled:opacity-50"
          >
            {availability.isSaving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </footer>
    </ModalDialog>
  );
}

function ProfileBody({ profile }: { profile: MentorProfile }) {
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const form = useMentorProfileForm(profile);
  const availabilitySettingsQuery = useMentorAvailabilitySettings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const programsQuery = usePrograms();

  const weeklyRanges = availabilitySettingsQuery.data?.rules ?? [];
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
  const editing = form.isEditing;

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
        <section className="mt-[22px] grid grid-cols-2 gap-4 rounded-xl bg-[#f2f8fc] px-6 py-[18px] md:grid-cols-4">
          {(
            [
              ["Aktif mentorluk", accepted.length],
              ["Bekleyen talep", pending.length],
              ["Toplam görüşme", meetings.length],
              ["Haftalık aralık", weeklyRanges.length],
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
              {editing ? (
                <label className="block text-[11.5px] text-[#676e78]">
                  Hakkında
                  <textarea
                    value={form.form.about}
                    onChange={(event) =>
                      form.updateField("about", event.target.value)
                    }
                    className="mt-1 block min-h-24 w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                  />
                </label>
              ) : (
                <p className="text-[13px] leading-5 text-[#4a5059]">
                  {form.form.about || "Henüz hakkında bilgisi eklenmedi."}
                </p>
              )}
              <label className="mt-3 block text-[11.5px] text-[#676e78]">
                Ünvan
                <input
                  readOnly={!editing}
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
                  readOnly={!editing}
                  value={form.form.company}
                  onChange={(event) =>
                    form.updateField("company", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                />
              </label>
            </Card>
            <Card title="Kapasite ve deneyim">
              <label className="block text-[11.5px] text-[#676e78]">
                Aynı anda en fazla kaç mentee
                <input
                  type="number"
                  min={1}
                  max={50}
                  readOnly={!editing}
                  value={form.form.menteeCapacity ?? ""}
                  onChange={(event) => form.updateCapacity(event.target.value)}
                  className="mt-1 block w-32 rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                />
              </label>
              <div className="mt-4 space-y-3">
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
                          readOnly={!editing}
                          value={experience[field]}
                          onChange={(event) =>
                            form.updateExperience(
                              index,
                              field,
                              event.target.value,
                            )
                          }
                          className="mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px] text-[#22262b]"
                        />
                      </label>
                    ))}
                    {editing ? (
                      <button
                        type="button"
                        onClick={() => form.removeExperience(index)}
                        className="justify-self-start text-xs text-[#a65a15]"
                      >
                        Deneyimi kaldır
                      </button>
                    ) : null}
                  </fieldset>
                ))}
                {editing && form.canAddExperience ? (
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
                  type="button"
                  onClick={() => setAvailabilityOpen(true)}
                  className="text-[12.5px] font-medium text-[#26a4ff]"
                >
                  Düzenle
                </button>
              }
            >
              <p className="text-xs text-[#676e78]">Haftalık uygunluk</p>
              <div className="mt-4 space-y-3">
                {availabilitySettingsQuery.isLoading ? (
                  <p className="text-xs text-[#858c96]">Yükleniyor...</p>
                ) : weeklyRanges.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Tanımlı haftalık saat yok.
                  </p>
                ) : (
                  weeklyRanges.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex justify-between text-[12.5px]"
                    >
                      <span className="text-[#4a5059]">
                        {WEEKDAY_LABELS[rule.dayOfWeek]}
                      </span>
                      <span className="font-medium">
                        {toTimeInput(rule.startTime)}–
                        {toTimeInput(rule.endTime)}
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
        <AvailabilityModal onClose={() => setAvailabilityOpen(false)} />
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
