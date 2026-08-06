"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";

const steps = ["İhtiyaç", "Beklenti", "Bilgiler", "Mentor Seçimi", "Talep"];
const supportAreas = [
  "Ürün ve ürün yönetimi",
  "Kullanıcı araştırması ve tasarım",
  "Yazılım ve teknoloji",
  "Satış ve pazarlama",
  "İş modeli ve strateji",
  "Finans ve yatırım",
  "Hukuk ve fikrî mülkiyet",
  "Ekip ve organizasyon",
  "Destek programları ve teşvikler",
  "Diğer",
];

const urgencyOptions = [
  "Bu hafta",
  "Önümüzdeki iki hafta",
  "Bu ay",
  "Acil değil",
];

const mentors = [
  {
    initials: "DK",
    name: "Dr. Kemal Arslan",
    role: "Ürün & Araştırma Direktörü · Trendyol",
    availability: "Bu hafta müsait",
    tags: ["Kullanıcı araştırması", "MVP testi", "UX stratejisi"],
    meta: ["Online", "Mesajlaşma açık", "Yapılandırılmış & Uygulamalı"],
    reasons: [
      "MVP seviyesindeki girişimlerle çalışıyor",
      "Kullanıcı testi süreçlerinde deneyimli",
      "Bu hafta müsait",
    ],
  },
  {
    initials: "SÖ",
    name: "Selin Öztürk",
    role: "Kurucu · HealthTech Ventures",
    availability: "Bu hafta müsait",
    tags: ["B2B SaaS", "Sağlık teknolojileri", "Ürün-pazar uyumu"],
    meta: ["Online / Yüz yüze", "Mesajlaşma açık", "Esnek & Birlikte keşfeden"],
    reasons: [
      "Sağlık teknolojileri deneyimi bulunuyor",
      "B2B SaaS konusunda uzmanlaşmış",
      "Kullanıcı doğrulama süreçlerinde aktif",
    ],
  },
  {
    initials: "MÇ",
    name: "Murat Çelik",
    role: "Ürün Müdürü · Peak Games",
    availability: "Gelecek hafta müsait",
    tags: ["Ürün analitik", "Kullanıcı segmentasyonu", "Test metodolojisi"],
    meta: ["Online", "Yalnızca toplantı", "Yönlendirici & Stratejik"],
    reasons: [
      "Test metodolojisi konusunda uzmanlaşmış",
      "Büyük kullanıcı kitleleriyle çalışma deneyimi",
    ],
  },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-5 gap-2">
      {steps.map((label, index) => {
        const step = index + 1;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-xs ${step <= current ? "text-[#555]" : "text-[#aaa]"}`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full font-semibold ${step === current ? "bg-[#555] text-white" : "bg-[#f1f1f1]"}`}
            >
              {step}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function PersonChoice({
  initials,
  name,
  role,
  selected,
  onClick,
}: {
  initials: string;
  name: string;
  role: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 items-center gap-3 rounded-lg border bg-white p-3 text-left ${selected ? "border-[#777]" : "border-[#e5e7eb]"}`}
    >
      <Avatar initials={initials} size="sm" />
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <strong className="block text-sm font-medium">{name}</strong>
          {selected && name === "Ayşe Kaya" ? <Badge>Ben</Badge> : null}
        </span>
        <span className="mt-0.5 block text-xs text-[#8a8a8a]">{role}</span>
      </span>
      {selected ? <span>✓</span> : null}
    </button>
  );
}

export function MentorRequestFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedStep = Number(params.get("step"));
  const excludedMentor = params.get("exclude");
  const availableMentors = excludedMentor
    ? mentors.filter((item) => item.name !== excludedMentor)
    : mentors;
  const [step, setStep] = useState(() =>
    Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 5
      ? requestedStep
      : 1,
  );
  const [person, setPerson] = useState("Ayşe Kaya");
  const [area, setArea] = useState("Ürün ve ürün yönetimi");
  const [summary, setSummary] = useState("");
  const [urgency, setUrgency] = useState(() =>
    requestedStep > 1 ? "Bu hafta" : "",
  );
  const [format, setFormat] = useState("Tek görüşme");
  const [meetingMode, setMeetingMode] = useState("Online");
  const [mentor, setMentor] = useState(() => availableMentors[0]?.name ?? "");

  const titles = [
    [
      "Hangi konuda desteğe ihtiyacınız var?",
      "İhtiyacınızı doğru tanımlamanız, size daha uygun mentorların önerilmesini sağlar.",
    ],
    [
      "Nasıl bir destek arıyorsunuz?",
      "Mentorluk biçimi ve iletişim tercihlerinizi belirleyin.",
    ],
    [
      "Mentorla paylaşılacak bilgileri kontrol edin",
      "Aşağıdaki bilgiler startup profilinizden otomatik olarak alınmıştır.",
    ],
    [
      "İhtiyacınıza uygun mentorlar",
      "Alan: Ürün & ürün yönetimi · Kullanıcı testi",
    ],
    [
      "Mentorluk talebinizi gözden geçirin",
      "Göndermeden önce seçimlerinizi kontrol edin.",
    ],
  ];

  return (
    <AppShell
      backHref={step === 1 ? "/dashboard" : undefined}
      title={titles[step - 1][0]}
      subtitle={titles[step - 1][1]}
    >
      <div className="mx-auto w-full max-w-[1216px] px-4 py-6 sm:px-8">
        <StepIndicator current={step} />

        <div className="mt-8">
          {step === 1 ? (
            <div className="space-y-7">
              <section>
                <h2 className="mb-3 text-sm font-semibold">
                  Bu mentorluk sürecini kim/ kimler yürütecek?
                </h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["AK", "Ayşe Kaya", "CEO"],
                    ["BŞ", "Burak Şahin", "CTO"],
                    ["ED", "Ece Doğan", "Tasarım"],
                  ].map(([initials, name, role]) => (
                    <PersonChoice
                      key={name}
                      initials={initials}
                      name={name}
                      role={role}
                      selected={person === name}
                      onClick={() => setPerson(name)}
                    />
                  ))}
                </div>
              </section>
              <section>
                <h2 className="mb-3 text-sm font-semibold">
                  Hangi alanda destek istiyorsunuz?
                </h2>
                <div className="grid gap-2 md:grid-cols-2">
                  {supportAreas.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setArea(item)}
                      className={`min-h-10 rounded-md border px-3 text-left text-sm ${area === item ? "border-[#555] bg-white" : "border-[#e5e7eb] bg-white"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
              <label className="block rounded-lg border border-[#e5e7eb] bg-white p-4">
                <span className="text-xs font-semibold uppercase text-[#777]">
                  Talep Özeti
                </span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="Lütfen sorun veya talebinizi belirtiniz..."
                  className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm outline-none placeholder:italic placeholder:text-[#ccc]"
                />
              </label>
              {summary.trim() ? (
                <section aria-live="polite">
                  <h2 className="mb-3 text-sm font-semibold">
                    Bu ihtiyaç ne kadar acil?
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {urgencyOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={urgency === option}
                        onClick={() => setUrgency(option)}
                        className={`min-h-10 rounded-md border px-3 text-sm ${urgency === option ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-7">
                <section>
                  <h2 className="mb-3 text-sm font-semibold">
                    Mentorluk biçimi
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      [
                        "Tek görüşme",
                        "Belirli bir soru, karar veya doküman için tek seferlik görüşme.",
                      ],
                      [
                        "Kısa mentorluk süreci",
                        "Belirli bir hedef için birkaç görüşmeden oluşan süreç.",
                      ],
                      [
                        "Düzenli mentorluk",
                        "Haftalık veya iki haftalık ilerleme takibi.",
                      ],
                      [
                        "Uzman yönlendirmesi",
                        "Profesyonel hizmet veya uzman danışmanlığı gerektiren konular.",
                      ],
                    ].map(([label, description]) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setFormat(label)}
                        className={`rounded-lg border bg-white p-4 text-left ${format === label ? "border-[#555]" : "border-[#e5e7eb]"}`}
                      >
                        <strong className="text-sm">{label}</strong>
                        <span className="mt-2 block text-xs leading-5 text-[#777]">
                          {description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h2 className="mb-3 text-sm font-semibold">
                    Görüşme tercihi
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {["Online", "Yüz yüze", "Fark etmez"].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setMeetingMode(item)}
                        className={`rounded-full border px-4 py-2 text-sm ${meetingMode === item ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
              <RequestSummary area={area} person={person} urgency={urgency} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold">
                        Startup Bilgileri
                      </h2>
                      <p className="mt-2 text-base font-semibold">NovaMed AI</p>
                      <p className="mt-1 text-sm text-[#777]">
                        Sağlık Teknolojileri
                      </p>
                    </div>
                    <SecondaryButton>Düzenle</SecondaryButton>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#555]">
                    Hastane süreçlerini yapay zeka ile otomatize eden B2B SaaS
                    platform.
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-[#999]">Seviye</dt>
                      <dd className="mt-1">MVP</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#999]">Ekip</dt>
                      <dd className="mt-1">4 kişi</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#999]">Program</dt>
                      <dd className="mt-1">Başlangıç 2024</dd>
                    </div>
                  </dl>
                </section>
                <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold">Ekip Üyeleri</h2>
                      <p className="mt-1 text-xs text-[#777]">
                        Mentora gösterilecek üyeler
                      </p>
                    </div>
                    <SecondaryButton>Düzenle</SecondaryButton>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ["AK", "Ayşe Kaya", "CEO"],
                      ["BŞ", "Burak Şahin", "CTO"],
                      ["ED", "Ece Doğan", "Tasarım"],
                    ].map(([initials, name, role]) => (
                      <div key={name} className="flex items-center gap-2">
                        <Avatar initials={initials} size="sm" />
                        <span>
                          <strong className="block text-xs">{name}</strong>
                          <span className="text-xs text-[#999]">{role}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="space-y-4">
                <RequestSummary area={area} person={person} urgency={urgency} />
                <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                  <h2 className="text-sm font-semibold">
                    Talebe Eklenecek Dosyalar
                  </h2>
                  <p className="mt-1 text-xs text-[#777]">
                    İsteğe bağlı — yalnızca seçtiğiniz dosyalar paylaşılır.
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      "Pitch Deck",
                      "Ürün Demosu",
                      "Araştırma Raporu",
                      "Teknik Doküman",
                      "Finansal Doküman",
                    ].map((file, index) => (
                      <label key={file} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={index === 0}
                          className="size-4 accent-[#555]"
                        />
                        {file}
                      </label>
                    ))}
                  </div>
                  <SecondaryButton className="mt-4 w-full border-dashed">
                    Dosya Yükle
                  </SecondaryButton>
                </section>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {["Tümü", "Uzmanlık", "Müsaitlik", "Online", "Yüz yüze"].map(
                  (filter, index) => (
                    <button
                      key={filter}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-xs ${index === 0 ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                    >
                      {filter}
                    </button>
                  ),
                )}
              </div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#999]">
                En Uygun Mentorlar
              </h2>
              <div className="space-y-3">
                {availableMentors.map((item) => (
                  <article
                    key={item.name}
                    className={`rounded-lg border bg-white p-4 ${mentor === item.name ? "border-[#777]" : "border-[#e5e7eb]"}`}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <Avatar initials={item.initials} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[#171717]">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#777]">
                          {item.role}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge>{item.availability}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2 border-t border-[#f0f0f0] py-3 text-xs text-[#777] md:grid-cols-3">
                      {item.meta.map((meta) => (
                        <span key={meta}>{meta}</span>
                      ))}
                    </div>
                    <div className="rounded-md bg-[#f9fafb] p-3">
                      <strong className="text-xs">Neden önerildi?</strong>
                      <ul className="mt-2 space-y-1 text-xs text-[#777]">
                        {item.reasons.map((reason) => (
                          <li key={reason}>✓ {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton href="/mentors/compare">
                        Profili Gör
                      </SecondaryButton>
                      <PrimaryButton onClick={() => setMentor(item.name)}>
                        {mentor === item.name ? "Seçildi" : "Mentor Seç"}
                      </PrimaryButton>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="mx-auto max-w-3xl space-y-4">
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                <div className="flex items-center gap-3">
                  <Avatar initials="DK" />
                  <div className="flex-1">
                    <p className="text-xs text-[#999]">Seçilen Mentor</p>
                    <h2 className="mt-1 text-sm font-semibold">{mentor}</h2>
                    <p className="mt-1 text-xs text-[#777]">
                      Ürün & Araştırma Direktörü · Trendyol
                    </p>
                  </div>
                  <Badge tone="green">Bu hafta müsait</Badge>
                </div>
              </section>
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                <h2 className="text-sm font-semibold">İhtiyaç Özeti</h2>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[#999]">Konu</dt>
                    <dd className="mt-1">{area} · Kullanıcı testi</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#999]">Aciliyet</dt>
                    <dd className="mt-1">{urgency}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#999]">Problem</dt>
                    <dd className="mt-1">
                      Test yöntemini ve doğru kullanıcı grubunu belirleme
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#999]">Mentorluk biçimi</dt>
                    <dd className="mt-1">
                      {format} · {meetingMode}
                    </dd>
                  </div>
                </dl>
              </section>
              <label className="block rounded-lg border border-[#e5e7eb] bg-white p-5">
                <span className="text-sm font-semibold">Talep Mesajı</span>
                <textarea
                  defaultValue="Merhaba, MVP'mizi ilk kullanıcılarla test etmeye hazırlanıyoruz. Test yöntemi ve doğru segment konusunda görüşlerinizi almak isteriz."
                  className="mt-3 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm outline-none"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[#eee] pt-5">
          <SecondaryButton
            href={step === 1 ? "/dashboard" : undefined}
            onClick={
              step === 1 ? undefined : () => setStep((value) => value - 1)
            }
          >
            Geri
          </SecondaryButton>
          {step < 5 ? (
            <PrimaryButton
              disabled={step === 1 && (!summary.trim() || !urgency)}
              onClick={() => setStep((value) => value + 1)}
            >
              Devam Et ›
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => router.push("/mentor-request/sent")}>
              Talebi Gönder
            </PrimaryButton>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function RequestSummary({
  area,
  person,
  urgency,
}: {
  area: string;
  person: string;
  urgency: string;
}) {
  return (
    <aside className="h-fit rounded-lg border border-[#e5e7eb] bg-white p-4">
      <h2 className="text-xs font-semibold uppercase text-[#888]">
        Talep Özeti
      </h2>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-xs text-[#aaa]">Talep sahibi</dt>
          <dd className="mt-1">{person}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Destek alanı</dt>
          <dd className="mt-1">{area}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Startup</dt>
          <dd className="mt-1">NovaMed AI · MVP</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Aciliyet</dt>
          <dd className="mt-1">{urgency}</dd>
        </div>
      </dl>
    </aside>
  );
}
