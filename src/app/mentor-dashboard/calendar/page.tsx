"use client";

import { ChevronRight, FileText, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/hoc/app-shell";
import { AppArea } from "@/types/app-area";

const hours = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const days = [
  ["Pzt", "14"],
  ["Sal", "15"],
  ["Çar", "16"],
  ["Per", "17"],
  ["Cum", "18"],
];
type Kind = "meeting" | "available" | "program";
type Event = {
  day: number;
  row: number;
  span: number;
  title: string;
  subtitle?: string;
  kind: Kind;
};
const events: Event[] = [
  { day: 0, row: 5, span: 1, title: "Döngü · Gülse", kind: "meeting" },
  {
    day: 1,
    row: 5,
    span: 3,
    title: "Müsait",
    subtitle: "3 saat",
    kind: "available",
  },
  { day: 2, row: 1, span: 1, title: "Terra · Mert", kind: "meeting" },
  {
    day: 2,
    row: 2,
    span: 2,
    title: "Müsait",
    subtitle: "2 saat",
    kind: "available",
  },
  {
    day: 3,
    row: 7,
    span: 1,
    title: "METU Stars",
    subtitle: "Mentor buluşması",
    kind: "program",
  },
  {
    day: 4,
    row: 2,
    span: 1,
    title: "NovaTech · Deniz",
    subtitle: "Design System kickoff",
    kind: "meeting",
  },
  {
    day: 4,
    row: 6,
    span: 3,
    title: "Müsait",
    subtitle: "3 saat",
    kind: "available",
  },
];

function MeetingModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#22262b]/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-title"
    >
      <section className="w-full max-w-[560px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.22)]">
        <header className="relative border-b border-[#eef0f3] px-6 pb-4 pt-5">
          <p className="text-[11px] text-[#858c96]">Döngü · Gülse Buran</p>
          <h2 id="meeting-title" className="mt-1 text-xl font-semibold">
            UX Research Review
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-5 top-8"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-[#eaf6ff] px-2.5 py-1 font-medium text-[#26a4ff]">
              14 Eylül · 14:00 · 45 dk
            </span>
            <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[#676e78]">
              Online · Google Meet
            </span>
            <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[#676e78]">
              4. seans / 6
            </span>
          </div>
        </header>
        <div className="space-y-5 px-6 py-5 text-xs leading-5 text-[#4a5059]">
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
              Toplantı amacı
            </p>
            <p>
              Son kullanıcı testlerinin bulgularını birlikte yorumlamak ve
              onboarding akışının ikinci versiyonuna karar vermek.
            </p>
          </section>
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
              Gündem
            </p>
            <ol className="space-y-1">
              <li>1 · Kullanıcı testi bulguları (15 dk)</li>
              <li>2 · Onboarding akışı v2 kritiği (20 dk)</li>
              <li>3 · Sonraki iki haftanın işleri (10 dk)</li>
            </ol>
          </section>
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
              Önceki görüşmeden
            </p>
            <div className="rounded-lg bg-[#f2f8fc] px-3 py-2.5">
              <p className="font-medium text-[#26a4ff]">
                UX Flow Review · 5 Eylül
              </p>
              <p className="mt-1">
                Değer önerisi mesajı netleşmedi; ilk ekranın hedefi tek cümleyle
                tanımlanacak.
              </p>
            </div>
          </section>
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase text-[#858c96]">
              Bu görüşmeye bağlı işler
            </p>
            <div className="divide-y divide-[#eef0f3] overflow-hidden rounded-lg border border-[#e4e7ea]">
              {[
                ["Güncellenmiş kullanıcı akışı", "Teslim 11 Eyl", "Gecikti"],
                ["Revize prototip", "Teslim 14 Eyl", "İnceleme bekliyor"],
              ].map(([title, due, status]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <FileText className="size-4" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="font-medium text-[#22262b]">{title}</p>
                    <p className="text-[11px] text-[#858c96]">{due}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${status === "Gecikti" ? "border border-[#f2cda9] bg-[#fff8f0] text-[#b65d17]" : "bg-[#eef8ff] text-[#26a4ff]"}`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] px-6 py-4 text-xs">
          <button className="font-medium text-[#26a4ff]">
            Mentorluğa git →
          </button>
          <div className="flex gap-2">
            <button className="rounded-full border border-[#d4d8dd] px-4 py-2">
              Yeniden planla
            </button>
            <button className="rounded-full bg-[#f2f8fc] px-4 py-2 text-[#26a4ff]">
              Gülse’ye mesaj
            </button>
            <button className="rounded-full bg-[#26a4ff] px-4 py-2 text-white">
              Toplantıya katıl
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default function MentorCalendarPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [filter, setFilter] = useState("Tümü");
  const allowed = (event: Event) =>
    filter === "Tümü" ||
    (filter === "Mentorluk" && event.kind === "meeting") ||
    (filter === "Program" && event.kind === "program") ||
    (filter === "Müsaitlik" && event.kind === "available");
  return (
    <AppShell active={AppArea.Calendar} mentorHome>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-[39px]">Takvim</h1>
            <p className="mt-1 text-[13px] text-[#676e78]">
              Bu hafta 3 görüşme · 1 program etkinliği · 8 boş slot
            </p>
          </div>
          <button className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white">
            Yeni toplantı oluştur
          </button>
        </header>
        <div className="mt-[22px] flex gap-2">
          {["Tümü", "Mentorluk", "Program", "Müsaitlik"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full border px-3 py-[5px] text-xs font-medium ${filter === item ? "border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff]" : "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid items-start gap-6 xl:grid-cols-[804px_400px]">
          <section className="overflow-x-auto rounded-xl border border-[#e4e7ea] bg-white px-5 pb-5 pt-[18px]">
            <div className="flex h-[38px] min-w-[720px] items-center justify-between">
              <h2 className="text-base font-semibold">14–18 Eylül 2026</h2>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]">
                  Bugün
                </button>
                <ChevronRight className="size-[18px]" strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-[14px] grid min-w-[720px] grid-cols-[52px_repeat(5,1fr)] text-[11px]">
              <div />
              {days.map(([day, date]) => (
                <div
                  key={day}
                  className="flex h-[34px] items-center justify-center gap-1.5"
                >
                  <span className="text-[#676e78]">{day}</span>
                  <b className="text-[13px] font-medium">{date}</b>
                </div>
              ))}
              {hours.map((hour, row) => (
                <div className="contents" key={hour}>
                  <div className="pr-2 text-right text-[#858c96]">{hour}</div>
                  {days.map(([day], dayIndex) => (
                    <div
                      key={day}
                      className="relative h-[42px] border-l border-t border-[#eef0f3]"
                    >
                      {events
                        .filter(
                          (e) =>
                            e.day === dayIndex && e.row === row && allowed(e),
                        )
                        .map((event) => (
                          <button
                            key={event.title}
                            onClick={() =>
                              event.kind === "meeting" && setDetailOpen(true)
                            }
                            style={{ height: `${event.span * 42 - 2}px` }}
                            className={`absolute left-1 right-1 top-px z-10 overflow-hidden rounded-md px-2 py-1.5 text-left leading-[15px] ${event.kind === "meeting" ? "bg-[#26a4ff] text-white" : event.kind === "available" ? "bg-[#e9f2fa] text-[#26a4ff]" : "border border-[#e4e7ea] bg-[#f3f4f6] text-[#4a5059]"}`}
                          >
                            <b className="block text-[11px] font-semibold">
                              {event.title}
                            </b>
                            {event.subtitle ? (
                              <span className="block text-[10.5px] opacity-80">
                                {event.subtitle}
                              </span>
                            ) : null}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <aside className="space-y-4">
            <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
              <div className="flex justify-between">
                <h2 className="text-[15px] font-semibold">Müsaitliğim</h2>
                <button className="text-[12.5px] font-medium text-[#26a4ff]">
                  Düzenle
                </button>
              </div>
              <p className="mt-3 text-xs text-[#676e78]">
                Tekrarlayan haftalık uygunluk
              </p>
              <div className="mt-4 space-y-3 text-[12.5px]">
                {[
                  ["Salı", "14:00–17:00"],
                  ["Çarşamba", "10:00–13:00"],
                  ["Cuma", "15:00–18:00"],
                ].map(([day, time]) => (
                  <div key={day} className="flex justify-between">
                    <span>{day}</span>
                    <b className="font-medium">{time}</b>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between rounded-lg bg-[#f2f8fc] px-3 py-2.5 text-xs">
                <span className="text-[#676e78]">Bu hafta kapasite</span>
                <b className="font-medium text-[#26a4ff]">2 boş slot</b>
              </div>
            </section>
            <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
              <h2 className="text-[15px] font-semibold">Sıradaki görüşmeler</h2>
              <div className="mt-3 space-y-3">
                {[
                  ["UX Research Review", "Döngü · Gülse", "Pzt 14 · 14:00"],
                  ["Kapanış görüşmesi", "Terra · Mert", "Çar 16 · 10:00"],
                  [
                    "Design System kickoff",
                    "NovaTech · Deniz",
                    "Cum 18 · 11:00",
                  ],
                ].map(([title, sub, time]) => (
                  <button
                    onClick={() => setDetailOpen(true)}
                    key={title}
                    className="flex w-full items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-2.5 text-left"
                  >
                    <span>
                      <b className="block text-[13px] font-medium">{title}</b>
                      <span className="block text-[11.5px] text-[#676e78]">
                        {sub}
                      </span>
                    </span>
                    <span className="text-[11.5px] font-medium text-[#26a4ff]">
                      {time}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      {detailOpen ? (
        <MeetingModal onClose={() => setDetailOpen(false)} />
      ) : null}
    </AppShell>
  );
}
