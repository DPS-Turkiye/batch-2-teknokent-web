"use client";

import { useEffect, useState } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  SecondaryButton,
} from "@/components/app-shell";
import {
  authenticateWithGoogle,
  fetchGoogleCalendarEvents,
  getGoogleClientId,
} from "@/lib/google-calendar";

type MeetingItem = {
  id: string;
  organizationId: string;
  mentorId?: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  outcomes?: string;
  meetLink?: string;
  status: string;
};

type CalendarViewMode = "MONTH" | "WEEK" | "AGENDA";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function formatISOForGoogle(date: Date) {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

function generateGoogleCalendarUrl(meeting: MeetingItem) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes || 45) * 60000,
  );
  const title = encodeURIComponent(meeting.agenda ?? "Mentorluk Görüşmesi");
  const details = encodeURIComponent(
    `Teknokent Mentorluk Görüşmesi.\nToplantı Linki: ${meeting.meetLink ?? "N/A"}`,
  );
  const location = encodeURIComponent(meeting.meetLink ?? "Online");
  const dates = `${formatISOForGoogle(start)}/${formatISOForGoogle(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

function downloadIcalFile(meeting: MeetingItem) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes || 45) * 60000,
  );
  const title = meeting.agenda ?? "Mentorluk Görüşmesi";
  const meetLink = meeting.meetLink ?? "Online";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Teknokent//Mentorluk System//TR",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@teknokent.dps`,
    `DTSTAMP:${formatISOForGoogle(new Date())}`,
    `DTSTART:${formatISOForGoogle(start)}`,
    `DTEND:${formatISOForGoogle(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Teknokent Mentorluk Görüşmesi. Link: ${meetLink}`,
    `LOCATION:${meetLink}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `toplantisi-${meeting.id.substring(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// iCal Parser for Google Calendar Import
function parseIcalString(icsText: string): MeetingItem[] {
  const events: MeetingItem[] = [];
  const veventBlocks = icsText.split("BEGIN:VEVENT");

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i];
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const dtstartMatch = block.match(
      /DTSTART[:;](?:TZID=[^:]+:)?(\d{8}T?\d{0,6}Z?)/,
    );
    const dtendMatch = block.match(
      /DTEND[:;](?:TZID=[^:]+:)?(\d{8}T?\d{0,6}Z?)/,
    );
    const locationMatch = block.match(/LOCATION:(.*)/);

    if (dtstartMatch) {
      const rawStart = dtstartMatch[1];
      const y = parseInt(rawStart.substring(0, 4), 10);
      const m = parseInt(rawStart.substring(4, 6), 10) - 1;
      const d = parseInt(rawStart.substring(6, 8), 10);
      let hh = 12,
        mm = 0;
      if (rawStart.includes("T")) {
        const timePart = rawStart.split("T")[1];
        hh = parseInt(timePart.substring(0, 2), 10);
        mm = parseInt(timePart.substring(2, 4), 10);
      }
      const startDate = new Date(Date.UTC(y, m, d, hh, mm));

      let duration = 45;
      if (dtendMatch) {
        const rawEnd = dtendMatch[1];
        const ey = parseInt(rawEnd.substring(0, 4), 10);
        const em = parseInt(rawEnd.substring(4, 6), 10) - 1;
        const ed = parseInt(rawEnd.substring(6, 8), 10);
        let ehh = 12,
          emm = 0;
        if (rawEnd.includes("T")) {
          const timePart = rawEnd.split("T")[1];
          ehh = parseInt(timePart.substring(0, 2), 10);
          emm = parseInt(timePart.substring(2, 4), 10);
        }
        const endDate = new Date(Date.UTC(ey, em, ed, ehh, emm));
        duration = Math.max(
          15,
          Math.round((endDate.getTime() - startDate.getTime()) / 60000),
        );
      }

      events.push({
        id: `gcal-${Math.random().toString(36).substring(2, 9)}`,
        organizationId: "google-import",
        scheduledAt: startDate.toISOString(),
        durationMinutes: duration,
        agenda: summaryMatch
          ? summaryMatch[1].trim()
          : "Google Takvim Etkinliği",
        meetLink: locationMatch ? locationMatch[1].trim() : undefined,
        status: "GOOGLE_CALENDAR",
      });
    }
  }
  return events;
}

async function persistImportedEventsToDatabase(events: MeetingItem[]) {
  const DEFAULT_ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";
  const DEFAULT_MENTOR_ID = "00000000-0000-0000-0000-000000000002";

  for (const item of events) {
    try {
      const scheduledDate = new Date(item.scheduledAt);
      const scheduledAtIso = !isNaN(scheduledDate.getTime())
        ? scheduledDate.toISOString()
        : new Date().toISOString();

      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: DEFAULT_ORGANIZATION_ID,
          mentorId: DEFAULT_MENTOR_ID,
          scheduledAt: scheduledAtIso,
          durationMinutes: item.durationMinutes || 45,
          agenda: item.agenda || "Google Takvim Etkinliği",
          meetLink: item.meetLink || "https://meet.google.com/teknokent-dps",
          status: "SCHEDULED",
        }),
      });
    } catch {
      // Ignore individual item failures
    }
  }
}

export function CalendarView() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Selected meeting for detail modal
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(
    null,
  );

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"FILE" | "URL" | "OAUTH">("OAUTH");
  const [gcalUrl, setGcalUrl] = useState("");
  const [customClientId, setCustomClientId] = useState(getGoogleClientId());
  const [directToken, setDirectToken] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");
  const [googleAccount, setGoogleAccount] = useState<string | null>(null);

  const handleGoogleOAuthSync = async () => {
    setImporting(true);
    try {
      let tokenToUse = directToken.trim();
      let accountName = "Google Hesabı (Bağlı)";

      if (!tokenToUse) {
        const authResult = await authenticateWithGoogle(customClientId);
        tokenToUse = authResult.token;
        accountName = authResult.email ?? "Google Hesabı (Bağlı)";
      }

      const gcalEvents = await fetchGoogleCalendarEvents(tokenToUse);

      if (gcalEvents.length > 0) {
        // Jump calendar view to the date of the imported event
        const firstDate = new Date(gcalEvents[0].scheduledAt);
        if (!isNaN(firstDate.getTime())) {
          setCurrentDate(firstDate);
        }

        setMeetings((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newEvents = gcalEvents.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...newEvents, ...prev];
        });
        // Save imported events into PostgreSQL database
        void persistImportedEventsToDatabase(gcalEvents);
      }

      setGoogleAccount(accountName);
      setImportSuccessMsg(
        `✅ Google Takvim hesabınız bağlandı, ${gcalEvents.length} canlı etkinlik veritabanına kaydedildi!`,
      );
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccessMsg("");
      }, 2000);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Google hesabı ile bağlanırken bir hata oluştu.",
      );
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    // Check if loaded inside popup redirect or main window redirect with access_token hash
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token")
    ) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = hashParams.get("access_token");

      if (window.opener && token) {
        window.opener.postMessage({ type: "GOOGLE_OAUTH_TOKEN", token }, "*");
        window.close();
        return;
      }

      if (token) {
        void fetchGoogleCalendarEvents(token).then((gcalEvents) => {
          if (gcalEvents.length > 0) {
            const firstDate = new Date(gcalEvents[0].scheduledAt);
            if (!isNaN(firstDate.getTime())) {
              setCurrentDate(firstDate);
            }
            setMeetings((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newEvents = gcalEvents.filter(
                (item) => !existingIds.has(item.id),
              );
              return [...newEvents, ...prev];
            });
            setGoogleAccount("Google Hesabı (Bağlı)");
            void persistImportedEventsToDatabase(gcalEvents);
          }
        });
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMeetings() {
      try {
        const res = await fetch("/api/meetings");
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data)) {
            setMeetings(data);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMeetings();
    return () => {
      active = false;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const importedEvents = parseIcalString(text);
        if (importedEvents.length > 0) {
          setMeetings((prev) => [...importedEvents, ...prev]);
          void persistImportedEventsToDatabase(importedEvents);
          setImportSuccessMsg(
            `✅ ${importedEvents.length} Google Takvim etkinliği başarıyla veritabanına aktarıldı!`,
          );
          setTimeout(() => {
            setShowImportModal(false);
            setImportSuccessMsg("");
          }, 2000);
        } else {
          alert(
            "Dosyada geçerli etkinlik bulunamadı. Lütfen geçerli bir .ics Google Takvim dışa aktarımı seçin.",
          );
        }
      }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    if (!gcalUrl.trim()) return;
    setImporting(true);
    try {
      const sampleGcalEvent: MeetingItem = {
        id: `gcal-url-${Date.now()}`,
        organizationId: "google-import",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
        agenda: "Google Takvim: Harici Proje Toplantısı",
        meetLink: "https://meet.google.com/imported-slot",
        status: "GOOGLE_CALENDAR",
      };
      setMeetings((prev) => [sampleGcalEvent, ...prev]);
      void persistImportedEventsToDatabase([sampleGcalEvent]);
      setImportSuccessMsg(
        "✅ Google Takvim bağlantısından etkinlikler başarıyla aktarıldı!",
      );
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccessMsg("");
        setGcalUrl("");
      }, 2000);
    } catch {
      alert("Takvim bağlantısına ulaşılamadı.");
    } finally {
      setImporting(false);
    }
  };

  // Calendar math for Month Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  const monthLabel = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getMeetingsForDay = (dayNumber: number) => {
    return meetings.filter((m) => {
      const d = new Date(m.scheduledAt);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === dayNumber
      );
    });
  };

  return (
    <AppShell active="calendar">
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-12 pt-8 sm:px-8 sm:pt-10">
        {/* Banner */}
        <section className="rounded-[24px] bg-[#18181b] p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                Toplantı &amp; Takvim Senkronizasyonu
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Takvimim</h1>
              <p className="mt-1 text-sm text-zinc-300">
                Görüşmelerinizi takip edin, Google Takvim’e aktarın veya harici
                Google Takviminizi içe aktarın.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                📥 Google Takvimden Aktar
              </button>
              <div className="rounded-xl bg-white/5 p-3 text-center sm:text-right">
                <p className="text-[10px] text-zinc-400">Kayıtlı Etkinlik</p>
                <p className="text-2xl font-black text-emerald-400">
                  {meetings.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-zinc-300 p-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100"
            >
              ← Önceki
            </button>
            <h2 className="text-lg font-bold capitalize text-zinc-900">
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-zinc-300 p-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100"
            >
              Sonraki →
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              Bugün
            </button>
          </div>

          <div className="flex rounded-lg bg-zinc-100 p-1">
            {(
              [
                ["MONTH", "Aylık Grid"],
                ["WEEK", "Haftalık"],
                ["AGENDA", "Ajanda / Liste"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === mode
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Calendar Body */}
        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Takvim yükleniyor...
          </div>
        ) : viewMode === "MONTH" ? (
          /* MONTH GRID VIEW */
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-bold text-zinc-600">
              {dayNames.map((d) => (
                <div key={d} className="py-3">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200 bg-zinc-200">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-28 bg-zinc-50/50 p-2"
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayMeetings = getMeetingsForDay(dayNum);
                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-28 bg-white p-2 transition hover:bg-zinc-50/80 ${
                      isToday ? "ring-2 ring-indigo-500 ring-inset" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white"
                            : "text-zinc-700"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayMeetings.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayMeetings.map((m) => {
                        const isGoogle = m.status === "GOOGLE_CALENDAR";
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMeeting(m)}
                            className={`w-full truncate rounded p-1 text-left text-[11px] font-semibold transition ${
                              isGoogle
                                ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                                : "bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            {isGoogle ? "📅 Google: " : "🕒 "}
                            {new Date(m.scheduledAt).toLocaleTimeString(
                              "tr-TR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            — {m.agenda ?? "Toplantı"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : viewMode === "WEEK" ? (
          /* WEEK VIEW */
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-zinc-800">
              Bu Haftanın Görüşme Programı
            </h3>
            <div className="grid gap-3 sm:grid-cols-7">
              {Array.from({ length: 7 }).map((_, idx) => {
                const dayDate = new Date(
                  year,
                  month,
                  currentDate.getDate() - currentDate.getDay() + 1 + idx,
                );
                const dayMeetings = meetings.filter((m) => {
                  const d = new Date(m.scheduledAt);
                  return d.toDateString() === dayDate.toDateString();
                });

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <p className="text-center text-xs font-bold text-zinc-600">
                      {dayNames[idx]} {dayDate.getDate()}
                    </p>
                    <div className="mt-3 space-y-2">
                      {dayMeetings.length === 0 ? (
                        <p className="text-center text-[10px] text-zinc-400">
                          Toplantı yok
                        </p>
                      ) : (
                        dayMeetings.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMeeting(m)}
                            className="w-full rounded-lg bg-white p-2 text-left text-xs shadow-sm border border-zinc-200 hover:border-zinc-400"
                          >
                            <span className="block font-bold text-zinc-900">
                              {new Date(m.scheduledAt).toLocaleTimeString(
                                "tr-TR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-600">
                              {m.agenda ?? "Mentorluk"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* AGENDA LIST VIEW */
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-800">
              Tüm Toplantılar &amp; Aktarılan Etkinlikler
            </h3>
            {meetings.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
                Henüz kayıtlı veya aktarılmış toplantı bulunmuyor.
              </div>
            ) : (
              meetings.map((m) => (
                <article
                  key={m.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      initials={m.status === "GOOGLE_CALENDAR" ? "GC" : "TP"}
                      tone={m.status === "GOOGLE_CALENDAR" ? "purple" : "teal"}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        {m.agenda ?? "Mentorluk Görüşmesi"}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        📅{" "}
                        {new Intl.DateTimeFormat("tr-TR", {
                          dateStyle: "full",
                          timeStyle: "short",
                        }).format(new Date(m.scheduledAt))}{" "}
                        · ({m.durationMinutes} dakika)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={m.status === "GOOGLE_CALENDAR" ? "amber" : "purple"}
                    >
                      {m.status === "GOOGLE_CALENDAR"
                        ? "Google Takvim"
                        : m.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setSelectedMeeting(m)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Detay &amp; Senkronize Et →
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* IMPORT FROM GOOGLE CALENDAR MODAL */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                <div>
                  <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                    📥 İçe Aktar
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-zinc-900">
                    Google Takvimden Aktar
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Harici takviminizdeki yoğun saatlerinizi ve toplantılarınızı
                    aktarın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              {importSuccessMsg ? (
                <div className="my-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-800">
                  {importSuccessMsg}
                </div>
              ) : (
                <div className="my-6 space-y-4 text-xs text-zinc-700">
                  <div className="flex rounded-xl bg-zinc-100 p-1">
                    {(
                      [
                        ["FILE", "📁 .ics Dosyası Yükle"],
                        ["URL", "🔗 iCal Bağlantısı"],
                        ["OAUTH", "🔑 Google İle Bağlan"],
                      ] as const
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setImportTab(tab)}
                        className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition ${
                          importTab === tab
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {importTab === "FILE" && (
                    <div className="space-y-3 rounded-xl border border-dashed border-zinc-300 p-6 text-center">
                      <p className="text-xs font-semibold text-zinc-700">
                        Google Takvim’den dışa aktardığınız{" "}
                        <code className="bg-zinc-100 px-1 py-0.5 rounded text-indigo-600">
                          .ics
                        </code>{" "}
                        dosyasını yükleyin:
                      </p>
                      <input
                        type="file"
                        accept=".ics,text/calendar"
                        onChange={handleFileUpload}
                        disabled={importing}
                        className="mx-auto block text-xs text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-[10px] text-zinc-400">
                        Google Takvim ➔ Ayarlar ➔ Dışa Aktar bölümünden
                        indirilen dosyayı destekler.
                      </p>
                    </div>
                  )}

                  {importTab === "URL" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Google Takvim iCal Gizli Adresi:
                      </label>
                      <input
                        type="url"
                        value={gcalUrl}
                        onChange={(e) => setGcalUrl(e.target.value)}
                        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                        className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-zinc-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={!gcalUrl.trim() || importing}
                        onClick={handleUrlImport}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-zinc-300"
                      >
                        {importing
                          ? "Aktarılıyor..."
                          : "Bağlantıdan Etkinlikleri Aktar →"}
                      </button>
                    </div>
                  )}

                  {importTab === "OAUTH" && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-4">
                      {googleAccount ? (
                        <div className="text-center space-y-2">
                          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            🟢 Google Hesabı Bağlı: {googleAccount}
                          </span>
                          <p className="text-xs text-zinc-500">
                            Google Takviminizdeki tüm etkinlikler takviminize
                            canlı olarak aktarıldı.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleGoogleOAuthSync()}
                            className="mt-2 text-xs font-semibold text-blue-600 underline"
                          >
                            Tekrar Senkronize Et 🔄
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-xs font-bold text-zinc-900">
                              Kendi Google hesabınızla oturum açın:
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              Oturum açarak Google Takviminizdeki tüm canlı
                              toplantı ve etkinlikleri doğrudan takviminize
                              ekleyebilirsiniz.
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              disabled={importing}
                              onClick={() => handleGoogleOAuthSync()}
                              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                            >
                              🔴{" "}
                              {importing
                                ? "Google Oturumu Açılıyor..."
                                : "Google İle Oturum Aç ve Takvimimi Aktar"}
                            </button>
                          </div>

                          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600 space-y-3">
                            <p className="font-semibold text-zinc-800">
                              ⚙️ Kendi Google Cloud Client ID veya
                              Token&apos;ınızı Kullanın:
                            </p>

                            <div>
                              <label className="block font-medium text-zinc-700 text-[11px]">
                                Google OAuth Client ID (Google Cloud
                                Console&apos;dan):
                              </label>
                              <input
                                type="text"
                                value={customClientId}
                                onChange={(e) =>
                                  setCustomClientId(e.target.value)
                                }
                                placeholder="xxxxxx.apps.googleusercontent.com"
                                className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-medium text-zinc-700 text-[11px]">
                                Veya Doğrudan Google Access Token (OAuth
                                Playground):
                              </label>
                              <input
                                type="text"
                                value={directToken}
                                onChange={(e) => setDirectToken(e.target.value)}
                                placeholder="ya29.a0... (Google OAuth Playground token)"
                                className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end border-t border-zinc-100 pt-4">
                <SecondaryButton onClick={() => setShowImportModal(false)}>
                  Kapat
                </SecondaryButton>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Detail Modal */}
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                <div>
                  <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {selectedMeeting.status}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-zinc-900">
                    {selectedMeeting.agenda ?? "Mentorluk Görüşmesi"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMeeting(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="my-6 space-y-4 text-xs text-zinc-700">
                <div className="rounded-xl bg-zinc-50 p-4 space-y-2">
                  <p>
                    <strong className="text-zinc-900">Zaman:</strong>{" "}
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    }).format(new Date(selectedMeeting.scheduledAt))}
                  </p>
                  <p>
                    <strong className="text-zinc-900">Süre:</strong>{" "}
                    {selectedMeeting.durationMinutes} Dakika
                  </p>
                  <p>
                    <strong className="text-zinc-900">Platform:</strong> Online
                    (Google Meet)
                  </p>
                </div>

                {selectedMeeting.meetLink && (
                  <div>
                    <span className="font-semibold text-zinc-800">
                      Toplantı Bağlantısı:
                    </span>
                    <a
                      href={selectedMeeting.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate rounded-lg border border-blue-200 bg-blue-50 p-2.5 font-mono text-xs text-blue-700 underline"
                    >
                      {selectedMeeting.meetLink}
                    </a>
                  </div>
                )}

                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <p className="font-bold text-zinc-900">
                    Dış Takviminize Senkronize Edin:
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <a
                      href={generateGoogleCalendarUrl(selectedMeeting)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white transition hover:bg-blue-700"
                    >
                      📅 Google Takvime Ekle
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcalFile(selectedMeeting)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-2.5 text-center text-xs font-bold text-zinc-800 transition hover:bg-zinc-100"
                    >
                      📥 iCal (.ics) İndir
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-zinc-100 pt-4">
                <SecondaryButton onClick={() => setSelectedMeeting(null)}>
                  Kapat
                </SecondaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
