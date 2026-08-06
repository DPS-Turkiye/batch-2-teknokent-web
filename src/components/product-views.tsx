"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode, useState } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";

export function RequestSentView() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl text-[#666]">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#171717]">
          Mentorluk talebiniz gönderildi
        </h1>
        <p className="mt-2 text-sm text-[#777]">
          Mentor talebinizi değerlendirdiğinde size bildirim göndereceğiz.
        </p>
        <dl className="mt-7 grid w-full grid-cols-2 gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 text-left text-sm">
          <Info label="Mentor" value="Dr. Kemal Arslan" />
          <Info label="Talep konusu" value="Kullanıcı testi" />
          <Info label="Gönderilme tarihi" value="9 Ağustos 2024" />
          <Info label="Beklenen yanıt süresi" value="~24 saat" />
          <Info label="Talep durumu" value="Yanıt bekleniyor" />
        </dl>
        <div className="mt-6 grid w-full gap-2">
          <PrimaryButton href="/mentor-request/status" className="w-full">
            Talep Detaylarını Gör
          </PrimaryButton>
          <SecondaryButton disabled className="w-full">
            Alternatif Mentorları İncele
          </SecondaryButton>
          <SecondaryButton
            href="/dashboard"
            className="w-full border-0 bg-transparent"
          >
            Ana Sayfaya Dön
          </SecondaryButton>
        </div>
        <button type="button" className="mt-6 text-xs text-[#aaa]">
          Fikrinizi değiştirdiniz mi?{" "}
          <span className="text-[#555]">Talebi geri çek</span>
        </button>
      </div>
    </AppShell>
  );
}

export function RequestStatusView() {
  const params = useSearchParams();
  const requestedState = params.get("state") ?? "waiting";
  const initial = ["waiting", "question", "accepted", "declined"].includes(
    requestedState,
  )
    ? requestedState
    : "waiting";
  const [state, setState] = useState(initial);
  const states = [
    ["waiting", "Yanıt Bekleniyor"],
    ["question", "Ek Bilgi İstendi"],
    ["accepted", "Kabul Edildi"],
    ["declined", "Uygun Değil"],
  ];
  return (
    <AppShell title="Talep Detayı" backHref="/dashboard">
      <div className="mx-auto max-w-[736px] px-4 py-6 sm:px-8">
        <div className="flex gap-2 overflow-x-auto">
          {states.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={state === id}
              onClick={() => setState(id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs ${state === id ? "border-[#555] bg-[#555] font-medium text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar initials="DK" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
              <p className="mt-1 text-xs text-[#777]">
                Kullanıcı testi · Gönderildi: 9 Ağustos 2024
              </p>
            </div>
            <Badge
              tone={
                state === "accepted"
                  ? "green"
                  : state === "declined"
                    ? "gray"
                    : "amber"
              }
            >
              {states.find(([id]) => id === state)?.[1]}
            </Badge>
          </div>
        </section>
        <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div>
            {state === "waiting" ? (
              <div>
                <h3 className="text-lg font-semibold">Yanıt bekleniyor</h3>
                <p className="mt-2 text-sm text-[#777]">
                  Beklenen yanıt süresi: ~24 saat
                </p>
                <p className="mt-1 text-xs text-[#aaa]">
                  Gönderim: 9 Ağustos 2024 · 14:32
                </p>
              </div>
            ) : null}
            {state === "question" ? (
              <div>
                <Badge tone="amber">Ek bilgi istendi</Badge>
                <p className="mt-4 text-sm font-semibold">Mentorun sorusu:</p>
                <blockquote className="mt-2 rounded-md bg-[#f9fafb] p-4 text-sm italic leading-6 text-[#555]">
                  “Şu ana kadar herhangi bir kullanıcı görüşmesi yaptınız mı?
                  Varsa bulguları paylaşabilir misiniz?”
                </blockquote>
                <textarea
                  placeholder="Yanıtınızı yazın…"
                  className="mt-4 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <SecondaryButton>Dosya Ekle</SecondaryButton>
                  <PrimaryButton>Yanıtı Gönder</PrimaryButton>
                </div>
              </div>
            ) : null}
            {state === "accepted" ? <AcceptedRequestCalendar /> : null}
            {state === "declined" ? (
              <div>
                <h3 className="text-lg font-semibold">Uygun değil</h3>
                <p className="mt-3 text-sm text-[#777]">Neden uygun değil:</p>
                <p className="mt-1 text-sm">Bu dönemde müsait değilim</p>
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-4">
                  <Avatar initials="SÖ" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Selin Öztürk</h4>
                    <p className="mt-1 text-xs text-[#777]">
                      Kurucu · HealthTech Ventures
                    </p>
                  </div>
                  <PrimaryButton href="/mentor-request?step=4&exclude=Dr.%20Kemal%20Arslan">
                    Alternatif Mentora Talep Gönder
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        {state === "waiting" ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <SecondaryButton>Talebi Geri Çek</SecondaryButton>
            <SecondaryButton href="/mentors/compare">
              Alternatif Mentorları Görüntüle
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

const acceptedCalendarDays = [
  ["Pzt 12", "09:00", "10:30", "14:00", "15:30"],
  ["Sal 13", "10:00", "11:30"],
  ["Çar 14", "09:00", "14:00", "16:00"],
  ["Per 15", "11:00", "15:00"],
  ["Cum 16", "10:00"],
];

function AcceptedRequestCalendar() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="rounded-md bg-[#f5f5f5] p-3 text-[#444]">
        <p className="text-xs font-semibold">Mentorun mesajı:</p>
        <p className="mt-1 text-sm leading-5">
          &quot;Merhaba, talebinizi inceledim. Kullanıcı testi konusunda
          yardımcı olmaktan memnuniyet duyarım. Bir sonraki adım olarak toplantı
          planlayalım.&quot;
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {acceptedCalendarDays.map(([day, ...slots]) => (
          <div key={day}>
            <h3 className="mb-2 text-center text-xs font-medium text-[#6a7282]">
              {day}
            </h3>
            <div className="space-y-2">
              {slots.map((slot) => {
                const value = `${day} ${slot}`;
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={selected === value}
                    onClick={() => setSelected(value)}
                    className={`h-9 w-full rounded-md border text-xs font-medium ${selected === value ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white text-[#364153]"}`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton disabled>Başka Saat Öner</SecondaryButton>
        <PrimaryButton
          href={selected ? "/meetings/research" : undefined}
          disabled={!selected}
        >
          Saat Seç
        </PrimaryButton>
      </div>
    </div>
  );
}

const comparisonRows = [
  ["İhtiyaç uyumu", "Çok yüksek", "Yüksek", "Orta"],
  [
    "İlgili uzmanlık",
    "Kullanıcı testi, UX",
    "B2B SaaS, Sağlık",
    "Analitik, Segmentasyon",
  ],
  ["Startup seviyesi", "Seed & MVP", "MVP & Büyüme", "Pre-seed & Seed"],
  ["Sektör deneyimi", "E-ticaret, SaaS", "HealthTech, SaaS", "Oyun, Tüketici"],
  ["Mentorluk tarzı", "Yapılandırılmış", "Esnek", "Yönlendirici"],
  ["Görüşme biçimi", "Online", "Online / YY", "Online"],
  ["Mesajlaşma", "✓ Açık", "✓ Açık", "× Kapalı"],
  ["Müsaitlik", "Bu hafta", "Bu hafta", "Gelecek hafta"],
  ["Yanıt süresi", "~24 saat", "~48 saat", "~24 saat"],
];

export function MentorComparisonView() {
  const mentors = [
    ["DK", "Dr. Kemal Arslan", "En uygun"],
    ["SÖ", "Selin Öztürk", ""],
    ["MÇ", "Murat Çelik", ""],
  ];
  return (
    <AppShell title="Mentor Karşılaştırması" backHref="/mentor-request">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
          <table className="min-w-[800px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className="w-1/4 p-4 text-left" />
                {mentors.map(([initials, name, label]) => (
                  <th key={name} className="w-1/4 p-4 text-left font-medium">
                    <span className="flex items-center gap-3">
                      <Avatar initials={initials} size="sm" />
                      {name}
                    </span>
                    {label ? (
                      <span className="mt-3 block text-xs">{label}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr
                  key={row[0]}
                  className={index % 2 ? "bg-[#fafafa]" : "bg-white"}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${row[0]}-${cellIndex}`}
                      className={`p-4 ${cellIndex === 0 ? "text-[#777]" : "text-[#444]"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {mentors.map(([, name]) => (
                  <td key={name} className="p-4">
                    <SecondaryButton className="mb-2 w-full border-0">
                      Profili Görüntüle
                    </SecondaryButton>
                    <PrimaryButton href="/mentor-request" className="w-full">
                      Bu Mentoru Seç
                    </PrimaryButton>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

export function ScheduleMeetingView() {
  const [selected, setSelected] = useState<string | null>(null);
  const days = [
    ["Pzt 12", "09:00", "10:30", "14:00", "15:30"],
    ["Sal 13", "10:00", "11:30"],
    ["Çar 14", "09:00", "14:00", "16:00"],
    ["Per 15", "11:00", "15:00"],
    ["Cum 16", "10:00"],
  ];
  return (
    <AppShell
      active="calendar"
      title="Toplantı Planla"
      backHref="/mentor-request/status?state=accepted"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <span className="text-sm">Dr. Kemal Arslan</span>
          <span>·</span>
          <span className="text-sm">Kullanıcı testi</span>
          <span>·</span>
          <Badge>Online</Badge>
        </section>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Bu hafta", "Gelecek hafta", "Sabah", "Öğleden sonra"].map(
            (label, index) => (
              <button
                key={label}
                type="button"
                className={`rounded-full border px-4 py-2 text-xs ${index === 0 ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <h2 className="mt-5 text-xs font-semibold text-[#777]">
          Ortak müsait zamanlar — Ağustos 2024
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {days.map(([day, ...slots]) => (
            <div key={day}>
              <h3 className="mb-2 text-center text-xs text-[#777]">{day}</h3>
              <div className="space-y-2">
                {slots.map((slot) => {
                  const value = `${day} ${slot}`;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelected(value)}
                      className={`h-9 w-full rounded-md border text-xs ${selected === value ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selected ? (
          <section className="mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="text-sm font-semibold">Toplantı Özeti</h2>
            <p className="mt-3 text-sm">Tarih: {selected}</p>
            <p className="mt-1 text-sm">Süre: 60 dakika</p>
            <p className="mt-1 text-sm">Biçim: Online</p>
            <p className="mt-3 text-xs text-[#888]">
              Toplantı linki onaydan sonra oluşturulacaktır.
            </p>
            <PrimaryButton href="/meetings/research" className="mt-4">
              Toplantıyı Planla
            </PrimaryButton>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function MeetingDetailView() {
  return (
    <AppShell
      active="meetings"
      title="Toplantı Detayı"
      backHref="/dashboard"
      actions={<PrimaryButton>▣ Toplantıya Katıl</PrimaryButton>}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar initials="DK" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
              <p className="mt-1 text-xs text-[#777]">
                Ürün & Araştırma Direktörü · Trendyol
              </p>
            </div>
            <Badge>Online</Badge>
          </div>
          <dl className="mt-4 grid gap-4 border-t border-[#eee] pt-4 text-sm sm:grid-cols-3">
            <Info label="Tarih & Saat" value="Pzt, 12 Ağustos · 14:00" />
            <Info label="Süre" value="60 dakika" />
            <Info label="Toplantı Linki" value="Linki Aç" />
          </dl>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p>Kullanıcı testi yöntemi ve segmentasyon belirleme</p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Katılacak Ekip Üyeleri">
              <Person initials="AK" name="Ayşe Kaya (CEO)" />
              <Person initials="BŞ" name="Burak Şahin (CTO)" />
            </Card>
            <Card title="Paylaşılan Dosyalar">
              <p>▱ Pitch Deck v3.pdf</p>
              <p className="mt-2 text-[#999]">△ Ürün demosu eksik</p>
              <button className="mt-3 text-xs" type="button">
                Dosya ekle →
              </button>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Hazırlık Durumu">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-[#eee]">
                  <div className="h-full w-2/5 rounded-full bg-[#777]" />
                </div>
                <span>2/5</span>
              </div>
              <SecondaryButton
                href="/meetings/research/prepare"
                className="mt-3 border-0 px-0"
              >
                Hazırlığa devam et →
              </SecondaryButton>
            </Card>
            <Card title="Önceki Toplantı Özeti">
              <p className="italic text-[#888]">
                İlk toplantı — özet henüz yok
              </p>
            </Card>
            <Card title="Açık Aksiyonlar">
              <ul className="space-y-2">
                <li>• Kullanıcı segmentini tanımla</li>
                <li>• Test soruları hazırla</li>
                <li>• Demo videosunu hazırla</li>
              </ul>
            </Card>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton disabled>Yeniden Planla</SecondaryButton>
          <SecondaryButton>Mentora Not Gönder</SecondaryButton>
          <SecondaryButton>Toplantıyı İptal Et</SecondaryButton>
        </div>
      </div>
    </AppShell>
  );
}

export function MentorshipDetailView() {
  const [tab, setTab] = useState("Genel Bakış");
  return (
    <AppShell
      active="mentorships"
      title="Mentorluk Süreci"
      backHref="/dashboard"
      actions={<PrimaryButton disabled>+ Toplantı Planla</PrimaryButton>}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-center">
          <Avatar initials="DK" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">
              Kullanıcı Araştırması &amp; Test
            </h2>
            <p className="mt-1 text-sm text-[#777]">
              Dr. Kemal Arslan · Trendyol
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#aaa]">
              <Badge>Devam Ediyor</Badge>
              <span>Başlangıç: 5 Ağustos 2024</span>
              <span>· Sonraki: 12 Ağustos 14:00</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium">Mentorluk Hedefi</p>
            <p className="mt-1 text-xs text-[#777]">
              Uygulanabilir kullanıcı testi planı oluşturmak
            </p>
          </div>
        </section>
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#e5e7eb]">
          {["Genel Bakış", "Toplantılar", "Aksiyonlar", "Dosyalar"].map(
            (label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === label ? "border-[#555] text-[#444]" : "border-transparent text-[#777]"}`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        {tab === "Genel Bakış" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_288px]">
            <div className="space-y-4">
              <Card title="Süreç Durumu">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#eee]">
                    <div className="h-full w-[35%] rounded-full bg-[#777]" />
                  </div>
                  <strong>%35</strong>
                </div>
                <p className="mt-3 text-xs text-[#aaa]">
                  2/3 toplantı tamamlandı · 5 aksiyon açık
                </p>
              </Card>
              <Card title="Son Görüşme Özeti">
                <p className="leading-6">
                  Kullanıcı segmentleri ve test senaryoları üzerine çalışıldı.
                  Primer kullanıcı grubu olarak “Hekim asistanları” belirlendi.
                  Bir sonraki adımda 5 kişilik pilot grup ile görüşme yapılacak.
                </p>
                <p className="mt-3 text-xs text-[#aaa]">5 Ağustos 2024</p>
              </Card>
              <Card title="Bir Sonraki Adım">
                <p>
                  Pilot kullanıcı görüşmeleri için soru seti hazırla ve 12
                  Ağustos toplantısına getir.
                </p>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Açık Risk">
                <p>
                  Demo video hazırlığı gecikiyor. Bir sonraki toplantıdan önce
                  tamamlanmalı.
                </p>
              </Card>
              <Card title="Mentor İletişimi">
                <p className="text-xs text-[#888]">Son mesaj: 7 Ağustos</p>
                <textarea
                  placeholder="Mentora kısa not gönder..."
                  className="mt-3 min-h-20 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                />
                <SecondaryButton className="mt-2">Gönder</SecondaryButton>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#777]">
            {tab} görünümü backend bağlantısı için hazır.
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function MeetingPreparationView() {
  const labels = [
    "Pitch deck'i güncelle",
    "Ürün demosunu ekle",
    "Görüşülecek üç ana soruyu yaz",
    "Önceki aksiyonları tamamla",
    "İlgili verileri yükle",
  ];
  const [checked, setChecked] = useState(() => new Set([labels[0]]));
  function toggle(label: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }
  return (
    <AppShell
      active="actions"
      title="Toplantıya hazırlanın"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <h2 className="text-sm font-semibold">
            △ Toplantıya 10 saatten az kaldı
          </h2>
          <p className="mt-2 text-xs text-[#777]">
            {labels.length - checked.size} görev tamamlanmadı. Toplantı
            öncesinde hazırlığınızı tamamlamanız önerilir.
          </p>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p className="font-medium">
                Kullanıcı testi yöntemi ve segmentasyon
              </p>
              <p className="mt-2 leading-5 text-[#777]">
                MVP&apos;yi ilk kullanıcılarla test etmeye hazırlanıyoruz. Test
                yöntemini ve doğru kullanıcı grubunu belirlemekte zorlanıyoruz.
              </p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir bir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Hazırlık Listesi">
              <div className="space-y-2">
                {labels.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(label)}
                      onChange={() => toggle(label)}
                      className="size-4 accent-[#555]"
                    />
                    <span
                      className={
                        checked.has(label) ? "text-[#aaa] line-through" : ""
                      }
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Gerekli Dosyalar">
              <p>
                ▱ Pitch Deck v3.pdf <Badge tone="green">Yüklendi</Badge>
              </p>
              <p className="mt-2">
                △ Ürün demosu <Badge>Eksik</Badge>
              </p>
              <p className="mt-2">
                △ Araştırma verisi <Badge>Eksik</Badge>
              </p>
              <SecondaryButton className="mt-4 w-full border-dashed">
                Dosya Yükle
              </SecondaryButton>
            </Card>
            <Card title="Mentora Not">
              <textarea
                placeholder="Mentora iletmek istediğiniz kısa bir not ekleyebilirsiniz..."
                className="min-h-24 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
              />
            </Card>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryButton href="/meetings/research">
            Toplantı Detayına Git ›
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}

export function MeetingFeedbackView() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const questions = [
    "Görüşme ihtiyacınıza ne kadar yardımcı oldu?",
    "Mentorun yaklaşımı ve yönlendirmesi nasıldı?",
    "Bu mentoru başka bir girişimciye önerir misiniz?",
  ];

  return (
    <AppShell
      active="meetings"
      title="Toplantıyı Değerlendir"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
            <p className="mt-1 text-xs text-[#777]">
              Kullanıcı testi · 12 Ağustos 2024
            </p>
          </div>
          <Badge>Tamamlandı</Badge>
        </section>

        <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-5">
          <h1 className="text-lg font-semibold">Görüşme nasıldı?</h1>
          <p className="mt-1 text-sm text-[#777]">
            Geri bildiriminiz mentorluk deneyimini geliştirmemize yardımcı olur.
          </p>
          <div className="mt-6 space-y-6">
            {questions.map((question) => (
              <fieldset key={question}>
                <legend className="text-sm font-medium">{question}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${question}: ${rating}`}
                      aria-pressed={ratings[question] === rating}
                      onClick={() =>
                        setRatings((current) => ({
                          ...current,
                          [question]: rating,
                        }))
                      }
                      className={`flex size-10 items-center justify-center rounded-md border text-sm ${ratings[question] === rating ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="mt-6 block text-sm font-medium">
            Bu mentorla devam etmek ister misiniz?
            <select className="mt-2 w-full rounded-md border border-[#e5e7eb] p-3 text-sm">
              <option>Henüz karar vermedim</option>
              <option>Evet, devam etmek isterim</option>
              <option>Hayır, başka bir mentor arıyorum</option>
            </select>
          </label>
          <label className="mt-5 block text-sm font-medium">
            Eklemek istediğiniz bir not var mı?
            <textarea
              placeholder="Deneyiminizi kısaca paylaşın..."
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton href="/meetings/research">
              Daha Sonra
            </SecondaryButton>
            <PrimaryButton href="/mentorships/research">
              Değerlendirmeyi Gönder
            </PrimaryButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#aaa]">{label}</dt>
      <dd className="mt-1 text-sm text-[#444]">{value}</dd>
    </div>
  );
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.03em] text-[#777]">
        {title}
      </h2>
      {children}
    </section>
  );
}
function Person({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Avatar initials={initials} size="sm" />
      <span>{name}</span>
    </div>
  );
}
