"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import {
  PersonChoice,
  RequestSummary,
  StepIndicator,
} from "@/components/mentor-request/request-presenters";
import { useMentorRequest } from "@/hooks/use-mentor-request";
import type { MentorProfile } from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import {
  MENTOR_REQUEST_SUPPORT_AREAS,
  MENTOR_REQUEST_TEAM_MEMBERS,
  MENTOR_REQUEST_TITLES,
  MENTOR_REQUEST_URGENCY_OPTIONS,
} from "@/lib/const";
import {
  FORMAT_BY_LABEL,
  MEETING_MODE_BY_LABEL,
  URGENCY_BY_LABEL,
} from "@/lib/mentor-request-options";
import { MentorRequestStep } from "@/types/mentor-request";

export function MentorRequestFlow({
  mentors: initialMentors,
  mentorLoadError,
  startup,
  startupLoadError,
}: {
  mentors: MentorProfile[];
  mentorLoadError?: string;
  startup: StartupContext;
  startupLoadError?: string;
}) {
  const router = useRouter();
  const session = useAppSession();
  const params = useSearchParams();
  const requestedStep = Number(params.get("step"));
  const excludedMentor = params.get("exclude");
  const {
    isMatching,
    isSubmitting,
    matchingError,
    mentors,
    prepareRecommendations,
    recommendationMetadata,
    submissionError,
    submitRequest,
  } = useMentorRequest(initialMentors, excludedMentor);
  const [step, setStep] = useState<MentorRequestStep>(() => {
    if (
      Number.isInteger(requestedStep) &&
      requestedStep >= MentorRequestStep.Need &&
      requestedStep <= MentorRequestStep.Review
    ) {
      return requestedStep as MentorRequestStep;
    }
    return MentorRequestStep.Need;
  });
  const [person, setPerson] = useState("");
  const [area, setArea] = useState("Ürün ve ürün yönetimi");
  const [summary, setSummary] = useState("");
  const [urgency, setUrgency] = useState(() =>
    requestedStep > MentorRequestStep.Need ? "Bu hafta" : "",
  );
  const [format, setFormat] = useState("Tek görüşme");
  const [meetingMode, setMeetingMode] = useState("Online");
  const [mentorId, setMentorId] = useState(() => initialMentors[0]?.id ?? "");
  const [requesterMessage, setRequesterMessage] = useState("");
  const selectedPerson = person || session?.fullName || "Mentee";
  const teamMembers = session
    ? ([
        [
          session.fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join(""),
          session.fullName,
          session.jobTitle,
        ],
      ] as const)
    : MENTOR_REQUEST_TEAM_MEMBERS;
  const selectedMentor = mentors.find((item) => item.id === mentorId) ?? null;
  const excludedMentorId = excludedMentor
    ? initialMentors.find((item) => item.fullName === excludedMentor)?.id
    : undefined;

  async function advanceStep() {
    if (step !== MentorRequestStep.Info) {
      setStep((value) => (value + 1) as MentorRequestStep);
      return;
    }

    try {
      const result = await prepareRecommendations({
        supportArea: area,
        summary,
        urgency: URGENCY_BY_LABEL[urgency as keyof typeof URGENCY_BY_LABEL],
        mentorshipFormat:
          FORMAT_BY_LABEL[format as keyof typeof FORMAT_BY_LABEL],
        meetingMode:
          MEETING_MODE_BY_LABEL[
            meetingMode as keyof typeof MEETING_MODE_BY_LABEL
          ],
        startup,
        excludedMentorId,
      });
      setMentorId(result.mentors[0]?.id ?? "");
      setStep(MentorRequestStep.MentorSelect);
    } catch {
      setStep(MentorRequestStep.MentorSelect);
    }
  }

  async function handleSubmit() {
    if (!selectedMentor || !recommendationMetadata) return;
    const savedRequest = await submitRequest({
      mentorId: selectedMentor.id,
      requestedForName: selectedPerson,
      supportArea: area,
      summary,
      urgency: URGENCY_BY_LABEL[urgency as keyof typeof URGENCY_BY_LABEL],
      mentorshipFormat: FORMAT_BY_LABEL[format as keyof typeof FORMAT_BY_LABEL],
      meetingMode:
        MEETING_MODE_BY_LABEL[
          meetingMode as keyof typeof MEETING_MODE_BY_LABEL
        ],
      requesterMessage: requesterMessage.trim() || summary.trim(),
      recommendationSnapshot: {
        ...recommendationMetadata,
        startupName: startup.name,
        startupSector: startup.sector,
        startupStage: startup.stage,
        startupSummary: startup.summary,
        startupTechnologies: startup.technologies,
        recommendations: mentors.map((mentor, index) => ({
          mentorId: mentor.id,
          rank: index + 1,
          selected: mentor.id === selectedMentor.id,
          mentorName: mentor.fullName,
          professionalTitle: mentor.professionalTitle,
          company: mentor.company,
          reasons: mentor.recommendationReasons,
          evidence: mentor.recommendationEvidence,
        })),
      },
    });
    router.push(
      `/mentor-request/sent?request=${encodeURIComponent(savedRequest.id)}`,
    );
  }

  return (
    <AppShell
      backHref={step === MentorRequestStep.Need ? "/dashboard" : undefined}
      title={MENTOR_REQUEST_TITLES[step][0]}
      subtitle={MENTOR_REQUEST_TITLES[step][1]}
    >
      <div className="mx-auto w-full max-w-[1216px] px-4 py-6 sm:px-8">
        <StepIndicator current={step} />

        {mentorLoadError || startupLoadError ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {[mentorLoadError, startupLoadError].filter(Boolean).join(" ")}
          </p>
        ) : null}

        <div className="mt-8">
          {step === MentorRequestStep.Need ? (
            <div className="space-y-7">
              <section>
                <h2 className="mb-3 text-sm font-semibold">
                  Bu mentorluk sürecini kim/ kimler yürütecek?
                </h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {teamMembers.map(([initials, name, role]) => (
                    <PersonChoice
                      key={name}
                      initials={initials}
                      name={name}
                      role={role}
                      selected={selectedPerson === name}
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
                  {MENTOR_REQUEST_SUPPORT_AREAS.map((item) => (
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
                    {MENTOR_REQUEST_URGENCY_OPTIONS.map((option) => (
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

          {step === MentorRequestStep.Expectation ? (
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
              <RequestSummary
                area={area}
                person={selectedPerson}
                startup={startup}
                urgency={urgency}
              />
            </div>
          ) : null}

          {step === MentorRequestStep.Info ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold">
                        Startup Bilgileri
                      </h2>
                      <p className="mt-2 text-base font-semibold">
                        {startup.name}
                      </p>
                      <p className="mt-1 text-sm text-[#777]">
                        {startup.sector || "Sektör belirtilmedi"}
                      </p>
                    </div>
                    <SecondaryButton>Düzenle</SecondaryButton>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#555]">
                    {startup.summary || "Girişim özeti henüz eklenmedi."}
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-[#999]">Seviye</dt>
                      <dd className="mt-1">
                        {startup.stage || "Belirtilmedi"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#999]">Ekip</dt>
                      <dd className="mt-1">
                        {startup.teamSize
                          ? `${startup.teamSize} kişi`
                          : "Belirtilmedi"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#999]">Program</dt>
                      <dd className="mt-1">
                        {startup.confirmedProfile
                          ? "Profil onaylandı"
                          : "Profil bekleniyor"}
                      </dd>
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
                    {teamMembers.map(([initials, name, role]) => (
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
                <RequestSummary
                  area={area}
                  person={selectedPerson}
                  startup={startup}
                  urgency={urgency}
                />
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

          {step === MentorRequestStep.MentorSelect ? (
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
              {isMatching ? (
                <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                  Talep ve girişim profiliniz kullanılarak öneriler
                  hazırlanıyor…
                </p>
              ) : null}
              {matchingError ? (
                <p
                  role="alert"
                  className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                  {matchingError} Mevcut mentor listesi gösteriliyor.
                </p>
              ) : null}
              <div className="space-y-3">
                {mentors.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-lg border bg-white p-4 ${mentorId === item.id ? "border-[#777]" : "border-[#e5e7eb]"}`}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <Avatar initials={item.initials} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[#171717]">
                          {item.fullName}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#777]">
                          {item.professionalTitle} · {item.company}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.specialties.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge>{item.availabilityLabel}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2 border-t border-[#f0f0f0] py-3 text-xs text-[#777] md:grid-cols-3">
                      {[
                        item.meetingMode,
                        item.communicationPreference,
                        item.mentoringStyle,
                      ].map((meta) => (
                        <span key={meta}>{meta}</span>
                      ))}
                    </div>
                    <div className="rounded-md bg-[#f9fafb] p-3">
                      <strong className="text-xs">Neden önerildi?</strong>
                      <ul className="mt-2 space-y-1 text-xs text-[#777]">
                        {item.recommendationReasons.map((reason) => (
                          <li key={reason}>✓ {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton href="/mentors/compare">
                        Profili Gör
                      </SecondaryButton>
                      <PrimaryButton onClick={() => setMentorId(item.id)}>
                        {mentorId === item.id ? "Seçildi" : "Mentor Seç"}
                      </PrimaryButton>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {step === MentorRequestStep.Review ? (
            <div className="mx-auto max-w-3xl space-y-4">
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                <div className="flex items-center gap-3">
                  <Avatar initials={selectedMentor?.initials ?? "MN"} />
                  <div className="flex-1">
                    <p className="text-xs text-[#999]">Seçilen Mentor</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      {selectedMentor?.fullName ?? "Mentor seçilmedi"}
                    </h2>
                    <p className="mt-1 text-xs text-[#777]">
                      {selectedMentor
                        ? `${selectedMentor.professionalTitle} · ${selectedMentor.company}`
                        : "Mentor seçimi adımına dönün."}
                    </p>
                  </div>
                  {selectedMentor ? (
                    <Badge tone="green">
                      {selectedMentor.availabilityLabel}
                    </Badge>
                  ) : null}
                </div>
              </section>
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                <h2 className="text-sm font-semibold">İhtiyaç Özeti</h2>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[#999]">Konu</dt>
                    <dd className="mt-1">{area}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#999]">Aciliyet</dt>
                    <dd className="mt-1">{urgency}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#999]">Problem</dt>
                    <dd className="mt-1">{summary}</dd>
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
                  value={requesterMessage}
                  onChange={(event) => setRequesterMessage(event.target.value)}
                  placeholder={summary}
                  className="mt-3 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm outline-none"
                />
              </label>
              {submissionError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                  {submissionError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[#eee] pt-5">
          <SecondaryButton
            href={step === MentorRequestStep.Need ? "/dashboard" : undefined}
            onClick={
              step === MentorRequestStep.Need
                ? undefined
                : () => setStep((value) => (value - 1) as MentorRequestStep)
            }
          >
            Geri
          </SecondaryButton>
          {step < MentorRequestStep.Review ? (
            <PrimaryButton
              disabled={
                step === MentorRequestStep.Need && (!summary.trim() || !urgency)
              }
              onClick={() => void advanceStep()}
            >
              {step === MentorRequestStep.Info && isMatching
                ? "Öneriler hazırlanıyor…"
                : "Devam Et ›"}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              disabled={
                isSubmitting || !selectedMentor || !recommendationMetadata
              }
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Gönderiliyor…" : "Talebi Gönder"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </AppShell>
  );
}
