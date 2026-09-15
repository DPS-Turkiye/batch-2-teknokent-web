"use client";

import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import {
  useMentorAvailabilitySettings,
  useMentorProfile,
  useMentorProfileForm,
  useUpdateMentorAvailabilitySettings,
} from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type {
  MentorAvailabilitySettings,
  MentorProfile,
  Weekday,
} from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";
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

function AvailabilityModal({ onClose }: { onClose: () => void }) {
  const settingsQuery = useMentorAvailabilitySettings();
  const updateSettings = useUpdateMentorAvailabilitySettings();
  const [draft, setSettings] = useState<MentorAvailabilitySettings | null>(
    null,
  );
  const [exception, setException] = useState({
    startsOn: "",
    endsOn: "",
    reason: "",
  });
  const settings = draft ?? settingsQuery.data ?? null;

  const toggleDay = (dayOfWeek: Weekday) =>
    setSettings((current) => {
      if (!current) return current;
      const exists = current.rules.some((rule) => rule.dayOfWeek === dayOfWeek);
      return {
        ...current,
        rules: exists
          ? current.rules.filter((rule) => rule.dayOfWeek !== dayOfWeek)
          : [
              ...current.rules,
              {
                id: `new-${dayOfWeek}`,
                dayOfWeek,
                startTime: "09:00",
                endTime: "17:00",
                slotMinutes: current.defaultMeetingDurationMinutes,
              },
            ],
      };
    });
  const save = async () => {
    if (!settings) return;
    await updateSettings.mutateAsync({
      ...settings,
      rules: settings.rules.map(
        ({ dayOfWeek, startTime, endTime, slotMinutes }) => ({
          dayOfWeek,
          startTime,
          endTime,
          slotMinutes,
        }),
      ),
    });
    onClose();
  };
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
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {!settings ? (
            <p className="text-xs text-[#858c96]">Yükleniyor...</p>
          ) : (
            <>
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase text-[#858c96]">
                  Haftalık uygunluk
                </p>
                <div className="space-y-2">
                  {WEEKDAY_ORDER.map((day) => {
                    const rule = settings.rules.find(
                      (item) => item.dayOfWeek === day,
                    );
                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between rounded-xl border border-[#e4e7ea] px-3 py-2.5"
                      >
                        <label className="flex items-center gap-3 text-[13px]">
                          <input
                            type="checkbox"
                            aria-label={`${WEEKDAY_LABELS[day]} uygun`}
                            checked={Boolean(rule)}
                            onChange={() => toggleDay(day)}
                          />
                          {WEEKDAY_LABELS[day]}
                        </label>
                        {rule ? (
                          <span className="flex gap-2">
                            <input
                              type="time"
                              aria-label={`${WEEKDAY_LABELS[day]} başlangıç`}
                              value={rule.startTime}
                              onChange={(event) =>
                                setSettings({
                                  ...settings,
                                  rules: settings.rules.map((item) =>
                                    item.dayOfWeek === day
                                      ? {
                                          ...item,
                                          startTime: event.target.value,
                                        }
                                      : item,
                                  ),
                                })
                              }
                              className="w-24 rounded-lg border border-[#d4d8dd] px-2 py-1 text-xs"
                            />
                            <input
                              type="time"
                              aria-label={`${WEEKDAY_LABELS[day]} bitiş`}
                              value={rule.endTime}
                              onChange={(event) =>
                                setSettings({
                                  ...settings,
                                  rules: settings.rules.map((item) =>
                                    item.dayOfWeek === day
                                      ? { ...item, endTime: event.target.value }
                                      : item,
                                  ),
                                })
                              }
                              className="w-24 rounded-lg border border-[#d4d8dd] px-2 py-1 text-xs"
                            />
                          </span>
                        ) : (
                          <span className="text-xs text-[#858c96]">Kapalı</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="space-y-3">
                <p className="text-[10px] font-semibold uppercase text-[#858c96]">
                  Kapasite ve varsayılanlar
                </p>
                {(
                  [
                    ["Eş zamanlı mentorluk limiti", "menteeCapacity"],
                    [
                      "Varsayılan görüşme süresi (dk)",
                      "defaultMeetingDurationMinutes",
                    ],
                    ["İki görüşme arası tampon (dk)", "meetingBufferMinutes"],
                  ] as const
                ).map(([label, key]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span>{label}</span>
                    <input
                      type="number"
                      value={settings[key]}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          [key]: Number(event.target.value),
                        })
                      }
                      className="w-24 rounded-lg border border-[#d4d8dd] px-3 py-2 text-right text-xs"
                    />
                  </label>
                ))}
              </section>
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase text-[#858c96]">
                  Uygun olmadığın tarihler
                </p>
                <div className="flex flex-wrap gap-2">
                  {settings.exceptions.map((item, index) => (
                    <button
                      key={`${item.startsOn}-${index}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          exceptions: settings.exceptions.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                      className="rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-3 py-1.5 text-xs"
                    >
                      {item.startsOn}
                      {item.endsOn !== item.startsOn ? ` – ${item.endsOn}` : ""}
                      {item.reason ? ` · ${item.reason}` : ""} ×
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <input
                    type="date"
                    aria-label="Başlangıç tarihi"
                    value={exception.startsOn}
                    onChange={(event) =>
                      setException({
                        ...exception,
                        startsOn: event.target.value,
                      })
                    }
                    className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                  />
                  <input
                    type="date"
                    aria-label="Bitiş tarihi"
                    value={exception.endsOn}
                    onChange={(event) =>
                      setException({ ...exception, endsOn: event.target.value })
                    }
                    className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                  />
                  <input
                    aria-label="İstisna nedeni"
                    value={exception.reason}
                    onChange={(event) =>
                      setException({ ...exception, reason: event.target.value })
                    }
                    placeholder="Neden (isteğe bağlı)"
                    className="rounded-lg border border-[#d4d8dd] px-2 py-2 text-xs"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!exception.startsOn) return;
                    setSettings({
                      ...settings,
                      exceptions: [
                        ...settings.exceptions,
                        {
                          startsOn: exception.startsOn,
                          endsOn: exception.endsOn || exception.startsOn,
                          reason: exception.reason || null,
                        },
                      ],
                    });
                    setException({ startsOn: "", endsOn: "", reason: "" });
                  }}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-[#26a4ff]"
                >
                  <Plus className="size-3" /> Tarih ekle
                </button>
              </section>
            </>
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-[#eef0f3] px-6 py-4">
          <p className="text-[11px] text-[#858c96]">
            Değişiklikler yaklaşan görüşmeleri etkilemez.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-[#d4d8dd] px-5 py-2.5 text-[12.5px]"
            >
              Vazgeç
            </button>
            <button
              onClick={() => void save()}
              disabled={!settings || updateSettings.isPending}
              className="rounded-full bg-[#26a4ff] px-5 py-2.5 text-[12.5px] text-white disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ProfileBody({ profile }: { profile: MentorProfile }) {
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const form = useMentorProfileForm(profile);
  const availabilitySettingsQuery = useMentorAvailabilitySettings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const programsQuery = usePrograms();

  const availability = availabilitySettingsQuery.data;
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
  const openSlots = availability?.rules ?? [];

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
              onClick={() => {
                if (profileEditing) void form.handleSave();
                setProfileEditing((current) => !current);
              }}
              disabled={form.isSaving}
              className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white disabled:bg-[#c9cdd2]"
            >
              {profileEditing ? "Kaydet" : "Profili düzenle"}
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
              {profileEditing ? (
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
              <label className="block text-[11.5px] text-[#676e78]">
                Ünvan
                <input
                  readOnly={!profileEditing}
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
                  readOnly={!profileEditing}
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
                          readOnly={!profileEditing}
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
                    {profileEditing ? (
                      <button
                        onClick={() => form.removeExperience(index)}
                        className="justify-self-start text-xs text-[#a65a15]"
                      >
                        Deneyimi kaldır
                      </button>
                    ) : null}
                  </fieldset>
                ))}
                {profileEditing && form.canAddExperience ? (
                  <button
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
                      {profileEditing ? (
                        <button
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
              {profileEditing ? (
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
                  onClick={() => setAvailabilityOpen(true)}
                  className="text-[12.5px] font-medium text-[#26a4ff]"
                >
                  Düzenle
                </button>
              }
            >
              <p className="text-xs text-[#676e78]">Açık görüşme saatleri</p>
              <div className="mt-4 space-y-3">
                {availabilitySettingsQuery.isLoading ? (
                  <p className="text-xs text-[#858c96]">Yükleniyor...</p>
                ) : openSlots.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Tanımlı açık saat yok.
                  </p>
                ) : (
                  openSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex justify-between text-[12.5px]"
                    >
                      <span className="text-[#4a5059]">
                        {WEEKDAY_LABELS[slot.dayOfWeek]}
                      </span>
                      <span className={"font-medium"}>
                        {slot.startTime}–{slot.endTime}
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
  const session = useAppSession();

  return (
    <AppShell mentorHome>
      {session?.role && session.role !== UserRole.Mentor ? (
        <p className="p-10 text-center text-sm text-[#a65a15]">
          Bu sayfa yalnızca mentorlar içindir.
        </p>
      ) : profileQuery.isLoading ? (
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
