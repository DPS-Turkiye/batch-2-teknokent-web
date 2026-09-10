"use client";

import { Plus, Star, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/hoc/app-shell";

const topics = [
  "UX Stratejisi",
  "Product Design",
  "User Research",
  "Product Experience",
  "Design Systems",
  "UX/UI Review",
  "Product Validation",
];
const availability = [
  ["Salı", "14:00–17:00"],
  ["Çarşamba", "10:00–13:00"],
  ["Cuma", "15:00–18:00"],
  ["Diğer günler", "Kapalı"],
];
const history = [
  ["NovaTech · Zeynep Er", "Mar – Haz 2026 · 8 seans", "4,8"],
  ["HubC · Kaan Şahin", "Oca – Nis 2026 · 6 seans", "4,6"],
  ["Meridyen · Elif Toprak", "Eki – Ara 2025 · 6 seans", "5,0"],
];
const weekdays = [
  { name: "Pazartesi", enabled: false, label: "Kapalı" },
  { name: "Salı", enabled: true, start: "14:00", end: "17:00" },
  { name: "Çarşamba", enabled: true, start: "10:00", end: "13:00" },
  { name: "Perşembe", enabled: false, label: "Kapalı" },
  { name: "Cuma", enabled: true, start: "15:00", end: "18:00" },
  { name: "Cumartesi", enabled: false, label: "Kapalı" },
  { name: "Pazar", enabled: false, label: "Kapalı" },
];

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold leading-[23px]">{title}</h2>
        {action ? (
          <button className="text-[12.5px] font-medium text-[#26a4ff]">
            {action}
          </button>
        ) : null}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function AvailabilityModal({ onClose }: { onClose: () => void }) {
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
            aria-label="Kapat"
            className="absolute right-5 top-7"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase text-[#858c96]">
            Haftalık uygunluk
          </p>
          <div className="space-y-2">
            {weekdays.map((day) => (
              <div
                key={day.name}
                className="flex h-[40px] items-center rounded-lg border border-[#e4e7ea] bg-[#fafbfc] px-3 text-[12px]"
              >
                <span
                  className={`mr-3 flex h-[18px] w-9 items-center rounded-full p-[2px] ${day.enabled ? "justify-end bg-[#26a4ff]" : "justify-start bg-[#d8dde3]"}`}
                >
                  <span className="size-[14px] rounded-full bg-white shadow-sm" />
                </span>
                <span
                  className={
                    day.enabled
                      ? "font-medium text-[#22262b]"
                      : "text-[#858c96]"
                  }
                >
                  {day.name}
                </span>
                {day.enabled ? (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="w-[86px] rounded-lg border border-[#d4d8dd] bg-white px-3 py-2">
                      {day.start}
                    </span>
                    <span className="text-[#858c96]">–</span>
                    <span className="w-[86px] rounded-lg border border-[#d4d8dd] bg-white px-3 py-2">
                      {day.end}
                    </span>
                    <button className="grid size-4 place-items-center rounded-full bg-[#26a4ff] text-white">
                      <Plus className="size-3" />
                    </button>
                  </div>
                ) : (
                  <span className="ml-auto text-[#858c96]">{day.label}</span>
                )}
              </div>
            ))}
          </div>
          <p className="mb-3 mt-5 text-[10px] font-semibold uppercase text-[#858c96]">
            Kapasite ve varsayılanlar
          </p>
          <div className="space-y-2 text-[12px]">
            {[
              ["Eş zamanlı mentorluk limiti", "5"],
              ["Varsayılan görüşme süresi", "45 dk"],
              ["İki görüşme arası tampon", "15 dk"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex h-[40px] items-center justify-between"
              >
                <span className="text-[#4a5059]">{label}</span>
                <span className="w-[120px] rounded-lg border border-[#d4d8dd] px-3 py-2">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="mb-3 mt-5 text-[10px] font-semibold uppercase text-[#858c96]">
            Uygun olmadığın tarihler
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-[#676e78]">
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1.5">
              21–25 Eylül · İzin
            </span>
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1.5">
              3 Ekim · Konferans
            </span>
            <button className="flex items-center gap-1 rounded-full border border-[#d4d8dd] px-3 py-1.5 text-[#26a4ff]">
              <Plus className="size-3" /> Tarih ekle
            </button>
          </div>
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
              onClick={onClose}
              className="rounded-full bg-[#26a4ff] px-5 py-2.5 text-[12.5px] text-white"
            >
              Kaydet
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default function MentorProfilePage() {
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  return (
    <AppShell mentorHome>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-[18px]">
            <div className="grid size-[88px] shrink-0 place-items-center rounded-full bg-[#e6f1f8] text-[26px] font-semibold text-[#26a4ff]">
              NÖ
            </div>
            <div>
              <h1 className="text-[28px] font-semibold leading-[43px]">
                Nihan Öztürk
              </h1>
              <p className="text-[13.5px] text-[#676e78]">
                Design / UX Mentor · 12 yıl ürün tasarımı deneyimi
              </p>
              <div className="mt-2 flex gap-2 text-xs font-medium">
                <span className="rounded-full bg-[#f2f8fc] px-3 py-[5px] text-[#26a4ff]">
                  METU Stars 2026
                </span>
                <span className="rounded-full border border-[#cbebda] bg-[#eefaf3] px-3 py-[5px] text-[#0f7a4d]">
                  Mentorluğa açık
                </span>
                <span className="rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-3 py-[5px] text-[#676e78]">
                  Türkçe · İngilizce
                </span>
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
            <button className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white">
              Profili düzenle
            </button>
          </div>
        </header>
        <section className="mt-[22px] grid grid-cols-5 rounded-xl bg-[#f2f8fc] px-6 py-[18px]">
          {[
            ["Aktif mentorluk", "4"],
            ["Tamamlanan", "7"],
            ["Toplam seans", "62"],
            ["Ortalama değerlendirme", "4,8"],
            ["Mentorluk süresi", "2 yıl"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[#858c96]">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </section>
        <div className="mt-[22px] grid items-start gap-6 lg:grid-cols-[minmax(0,804px)_400px]">
          <div className="space-y-[18px]">
            <Card title="Hakkında" action="Düzenle">
              <p className="text-[13px] leading-5 text-[#4a5059]">
                Erken aşama ürün ekipleriyle çalışıyorum. Odağım, ekiplerin “ne
                yapacağız” sorusundan önce “hangi soruyu cevaplıyoruz” sorusunu
                netleştirmesi. Son 6 yıldır B2C ve B2B SaaS ürünlerinde UX
                stratejisi ve tasarım sistemi kurulumu üzerine çalışıyorum.
              </p>
            </Card>
            <Card title="Mentorluk konuları">
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-[#f2f8fc] px-3 py-[5px] text-xs font-medium text-[#26a4ff]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Card>
            <Card title="Nasıl çalışıyorum">
              <ul className="space-y-3">
                {[
                  "Her mentorluk 5 aşamada ilerler: problem tanımı, araştırma, UX yönü, prototip, doğrulama.",
                  "Görüşme öncesi kısa bir hazırlık dosyası isterim; görüşme süresini tartışmaya ayırırız.",
                  "Her görüşme sonunda 2–3 somut iş atarım, bir sonraki görüşmede bunlarla başlarız.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[13px] leading-5 text-[#4a5059]"
                  >
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#26a4ff]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Mentorluk geçmişi" action="Tümünü gör">
              <div className="space-y-3">
                {history.map(([name, date, rating]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[13px] font-medium">{name}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                        {date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <Star className="size-3.5 fill-[#f5c451] text-[#22262b]" />
                      {rating}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <aside className="space-y-[18px]">
            <Card title="Müsaitlik" action="Düzenle">
              <p className="text-xs text-[#676e78]">
                Tekrarlayan haftalık uygunluk
              </p>
              <div className="mt-4 space-y-3">
                {availability.map(([day, time]) => (
                  <div key={day} className="flex justify-between text-[12.5px]">
                    <span className="text-[#4a5059]">{day}</span>
                    <span
                      className={
                        time === "Kapalı"
                          ? "font-medium text-[#858c96]"
                          : "font-medium"
                      }
                    >
                      {time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between rounded-lg bg-[#f2f8fc] px-3 py-2.5 text-xs">
                <span className="text-[#676e78]">Eş zamanlı mentorluk</span>
                <b className="font-medium text-[#26a4ff]">4 / 5</b>
              </div>
            </Card>
            <Card title="Görüşme tercihleri">
              <div className="space-y-3">
                {[
                  ["Varsayılan süre", "45 dk"],
                  ["Format", "Online"],
                  ["Görüşme sıklığı", "2 haftada 1"],
                  ["Ön hazırlık dosyası", "Zorunlu"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between text-[12.5px]"
                  >
                    <span className="text-[#4a5059]">{label}</span>
                    <b className="font-medium">{value}</b>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Programlar">
              <div className="space-y-3">
                {[
                  ["METU Stars 2026", "Aktif · Design mentor"],
                  ["Kuluçka İzmir 2025", "Tamamlandı"],
                ].map(([name, status]) => (
                  <div
                    key={name}
                    className="rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                  >
                    <p className="text-[13px] font-medium">{name}</p>
                    <p className="mt-0.5 text-[11.5px] text-[#676e78]">
                      {status}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </main>
      {availabilityOpen ? (
        <AvailabilityModal onClose={() => setAvailabilityOpen(false)} />
      ) : null}
    </AppShell>
  );
}
