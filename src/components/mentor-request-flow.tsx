"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import type { MentorProfile } from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import { useDemoSession } from "@/components/providers/session-provider";
import {
  MentorshipRequestSubmissionError,
  submitMentorshipRequest,
} from "@/lib/mentorship-requests";

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

const urgencyValues = {
  "Bu hafta": "THIS_WEEK",
  "Önümüzdeki iki hafta": "NEXT_TWO_WEEKS",
  "Bu ay": "THIS_MONTH",
  "Acil değil": "NOT_URGENT",
} as const;

const formatValues = {
  "Tek görüşme": "SINGLE_MEETING",
  "Kısa mentorluk süreci": "SHORT_TERM",
  "Düzenli mentorluk": "REGULAR",
  "Uzman yönlendirmesi": "EXPERT_REFERRAL",
} as const;

const meetingModeValues = {
  Online: "ONLINE",
  "Yüz yüze": "IN_PERSON",
  "Fark etmez": "NO_PREFERENCE",
} as const;

const urgencyLabels: Record<string, string> = {
  THIS_WEEK: "Bu hafta",
  NEXT_TWO_WEEKS: "Önümüzdeki iki hafta",
  THIS_MONTH: "Bu ay",
  NOT_URGENT: "Acil değil",
};

const formatLabels: Record<string, string> = {
  SINGLE_MEETING: "Tek görüşme",
  SHORT_TERM: "Kısa mentorluk süreci",
  REGULAR: "Düzenli mentorluk",
  EXPERT_REFERRAL: "Uzman yönlendirmesi",
};

const meetingModeLabels: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "Yüz yüze",
  NO_PREFERENCE: "Fark etmez",
};

type RecommendationMetadata = {
  matchingMethod: string;
  matchingModel?: string;
  generatedAt: string;
};

type MentorRequestDraft = {
  area: string;
  summary: string;
  urgency: string;
  format: string;
  meetingMode: string;
  requesterMessage: string | null;
};

type SourceMentorshipRequest = {
  supportArea: string;
  summary: string;
  urgency: string;
  mentorshipFormat: string;
  meetingMode: string;
  requesterMessage: string | null;
};

function readRequestDraft(storageKey: string): MentorRequestDraft | null {
  try {
    const savedDraft = sessionStorage.getItem(storageKey);
    if (!savedDraft) return null;

    const parsedDraft = JSON.parse(savedDraft) as Partial<MentorRequestDraft>;
    if (
      typeof parsedDraft.area !== "string" ||
      typeof parsedDraft.summary !== "string" ||
      typeof parsedDraft.urgency !== "string" ||
      typeof parsedDraft.format !== "string" ||
      typeof parsedDraft.meetingMode !== "string"
    ) {
      return null;
    }

    return {
      area: parsedDraft.area,
      summary: parsedDraft.summary,
      urgency: parsedDraft.urgency,
      format: parsedDraft.format,
      meetingMode: parsedDraft.meetingMode,
      requesterMessage:
        typeof parsedDraft.requesterMessage === "string"
          ? parsedDraft.requesterMessage
          : null,
    };
  } catch {
    return null;
  }
}

function normalizeStep(value: number): number {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 1;
}

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
          {selected ? <Badge>Ben</Badge> : null}
        </span>
        <span className="mt-0.5 block text-xs text-[#8a8a8a]">{role}</span>
      </span>
      {selected ? <span>✓</span> : null}
    </button>
  );
}

export function MentorRequestFlow({
  mentors,
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
  const session = useDemoSession();
  const params = useSearchParams();
  const requestedStep = Number(params.get("step"));
  const requestedMentorId = params.get("mentor");
  const excludedMentor = params.get("exclude");
  const sourceRequestId = params.get("request");
  const draftStorageKey = `teknokent:mentor-request-draft:${startup.organizationId}`;
  const baseAvailableMentors = excludedMentor
    ? mentors.filter((item) => item.fullName !== excludedMentor)
    : mentors;
  const excludedMentorId = excludedMentor
    ? mentors.find((item) => item.fullName === excludedMentor)?.id
    : undefined;
  const [step, setStep] = useState(() => normalizeStep(requestedStep));
  const [person, setPerson] = useState<string | null>(null);
  const [area, setArea] = useState("Ürün ve ürün yönetimi");
  const [summary, setSummary] = useState("");
  const [urgency, setUrgency] = useState(() =>
    requestedStep > 1 ? "Bu hafta" : "",
  );
  const [format, setFormat] = useState("Tek görüşme");
  const [meetingMode, setMeetingMode] = useState("Online");
  const [requesterMessage, setRequesterMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [recommendedMentors, setRecommendedMentors] = useState<
    MentorProfile[] | null
  >(null);
  const [matchingError, setMatchingError] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [recommendationMetadata, setRecommendationMetadata] =
    useState<RecommendationMetadata | null>(null);
  const [isSubmitting, startSubmission] = useTransition();
  const [mentorId, setMentorId] = useState(() =>
    baseAvailableMentors.some((item) => item.id === requestedMentorId)
      ? (requestedMentorId ?? "")
      : (baseAvailableMentors[0]?.id ?? ""),
  );
  const availableMentors = recommendedMentors ?? baseAvailableMentors;
  const selectedMentor =
    availableMentors.find((item) => item.id === mentorId) ?? null;
  const selectedPerson = person ?? session?.fullName ?? "Mentee";
  const sessionInitials = selectedPerson
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const teamMembers = [
    [sessionInitials || "ME", selectedPerson, session?.jobTitle ?? "Mentee"],
  ];
  const effectiveRequesterMessage = requesterMessage ?? summary.trim();

  useEffect(() => {
    function handleHistoryNavigation() {
      const nextStep = Number(
        new URLSearchParams(window.location.search).get("step"),
      );
      setStep(normalizeStep(nextStep));
    }

    window.addEventListener("popstate", handleHistoryNavigation);
    return () =>
      window.removeEventListener("popstate", handleHistoryNavigation);
  }, []);

  function goToStep(nextStep: number) {
    const normalizedStep = normalizeStep(nextStep);
    const url = new URL(window.location.href);

    sessionStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        area,
        summary,
        urgency,
        format,
        meetingMode,
        requesterMessage,
      } satisfies MentorRequestDraft),
    );

    if (normalizedStep === 1) {
      url.searchParams.delete("step");
    } else {
      url.searchParams.set("step", String(normalizedStep));
    }

    window.history.pushState({ mentorRequestStep: normalizedStep }, "", url);
    setStep(normalizedStep);
    if (normalizedStep === 4) void loadRecommendations();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadRecommendations() {
    const savedDraft = summary.trim()
      ? null
      : readRequestDraft(draftStorageKey);
    let matchArea = savedDraft?.area ?? area;
    let matchSummary = savedDraft?.summary ?? summary;
    let matchUrgency = savedDraft?.urgency ?? urgency;
    let matchFormat = savedDraft?.format ?? format;
    let matchMeetingMode = savedDraft?.meetingMode ?? meetingMode;
    let matchRequesterMessage =
      savedDraft?.requesterMessage ?? requesterMessage;

    if (!matchSummary.trim() && sourceRequestId) {
      setIsMatching(true);
      setMatchingError("");
      try {
        const sourceResponse = await fetch(
          `/api/mentor-requests/${sourceRequestId}`,
          { cache: "no-store" },
        );
        const sourceText = await sourceResponse.text();
        const sourceRequest = sourceText
          ? (JSON.parse(sourceText) as SourceMentorshipRequest & {
              message?: string;
            })
          : null;
        if (!sourceResponse.ok || !sourceRequest) {
          throw new Error(
            sourceRequest?.message ?? "Önceki talep bilgileri yüklenemedi.",
          );
        }

        matchArea = sourceRequest.supportArea;
        matchSummary = sourceRequest.summary;
        matchUrgency =
          urgencyLabels[sourceRequest.urgency] ?? urgencyOptions[0];
        matchFormat =
          formatLabels[sourceRequest.mentorshipFormat] ?? "Tek görüşme";
        matchMeetingMode =
          meetingModeLabels[sourceRequest.meetingMode] ?? "Online";
        matchRequesterMessage = sourceRequest.requesterMessage;

        setArea(matchArea);
        setSummary(matchSummary);
        setUrgency(matchUrgency);
        setFormat(matchFormat);
        setMeetingMode(matchMeetingMode);
        setRequesterMessage(matchRequesterMessage);
        sessionStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            area: matchArea,
            summary: matchSummary,
            urgency: matchUrgency,
            format: matchFormat,
            meetingMode: matchMeetingMode,
            requesterMessage: matchRequesterMessage,
          } satisfies MentorRequestDraft),
        );
      } catch (error) {
        setMatchingError(
          error instanceof Error
            ? error.message
            : "Önceki talep bilgileri yüklenemedi.",
        );
        setRecommendationMetadata(null);
        setRecommendedMentors(null);
        setIsMatching(false);
        return;
      }
    }

    if (!matchSummary.trim()) {
      setMatchingError(
        "Mentor önerileri için önce İhtiyaç adımında talep özetini doldurun.",
      );
      setRecommendationMetadata(null);
      setRecommendedMentors(null);
      return;
    }

    if (savedDraft) {
      setArea(savedDraft.area);
      setSummary(savedDraft.summary);
      setUrgency(savedDraft.urgency);
      setFormat(savedDraft.format);
      setMeetingMode(savedDraft.meetingMode);
      setRequesterMessage(savedDraft.requesterMessage);
    }

    setIsMatching(true);
    setMatchingError("");
    try {
      const response = await fetch("/api/mentor-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportArea: matchArea,
          summary: matchSummary,
          urgency: urgencyValues[matchUrgency as keyof typeof urgencyValues],
          mentorshipFormat:
            formatValues[matchFormat as keyof typeof formatValues],
          meetingMode:
            meetingModeValues[
              matchMeetingMode as keyof typeof meetingModeValues
            ],
          startupSector: startup.sector,
          startupStage: startup.stage,
          startupSummary: startup.summary,
          startupTechnologies: startup.technologies,
          excludedMentorId,
        }),
      });
      const responseText = await response.text();
      const body = responseText ? JSON.parse(responseText) : null;
      if (!response.ok || !Array.isArray(body)) {
        throw new Error(body?.message ?? "Mentor önerileri alınamadı.");
      }
      setRecommendationMetadata({
        matchingMethod:
          response.headers.get("x-matching-method") ?? "DETERMINISTIC",
        matchingModel: response.headers.get("x-matching-model") || undefined,
        generatedAt:
          response.headers.get("x-recommendation-generated-at") ??
          new Date().toISOString(),
      });
      setRecommendedMentors(body);
      setMentorId(body[0]?.id ?? "");
    } catch (error) {
      setMatchingError(
        `${
          error instanceof Error ? error.message : "Mentor önerileri alınamadı."
        } Mevcut mentor listesi gösteriliyor.`,
      );
      setRecommendationMetadata({
        matchingMethod: "FRONTEND_FALLBACK",
        matchingModel: "unranked-mentor-list",
        generatedAt: new Date().toISOString(),
      });
      setRecommendedMentors(baseAvailableMentors);
    } finally {
      setIsMatching(false);
    }
  }

  function submitRequest() {
    if (!selectedMentor || !recommendationMetadata) {
      setSubmissionError(
        "Mentor önerileri henüz hazırlanmadı. Lütfen mentor seçimi adımına dönün.",
      );
      return;
    }

    setSubmissionError("");
    startSubmission(async () => {
      try {
        const savedRequest = await submitMentorshipRequest({
          mentorId: selectedMentor.id,
          requestedForName: selectedPerson,
          supportArea: area,
          summary,
          urgency: urgencyValues[urgency as keyof typeof urgencyValues],
          mentorshipFormat: formatValues[format as keyof typeof formatValues],
          meetingMode:
            meetingModeValues[meetingMode as keyof typeof meetingModeValues],
          requesterMessage: effectiveRequesterMessage,
          recommendationSnapshot: {
            ...recommendationMetadata,
            startupName: startup.name,
            startupSector: startup.sector,
            startupStage: startup.stage,
            startupSummary: startup.summary,
            startupTechnologies: startup.technologies,
            recommendations: availableMentors.map((mentor, index) => ({
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
        sessionStorage.removeItem(draftStorageKey);
        router.push(`/mentor-request/sent?request=${savedRequest.id}`);
      } catch (error) {
        setSubmissionError(
          error instanceof MentorshipRequestSubmissionError
            ? error.message
            : "Talep kaydedilemedi. Lütfen tekrar deneyin.",
        );
      }
    });
  }

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
    ["İhtiyacınıza uygun mentorlar", `Alan: ${area} · ${summary.trim()}`],
    [
      "Mentorluk talebinizi gözden geçirin",
      "Göndermeden önce seçimlerinizi kontrol edin.",
    ],
  ];

  return (
    <AppShell
      backHref={step === 1 ? "/dashboard" : undefined}
      onBack={step > 1 ? () => goToStep(step - 1) : undefined}
      organizationName={startup.name}
      title={titles[step - 1][0]}
      subtitle={titles[step - 1][1]}
    >
      <div className="mx-auto w-full max-w-[1216px] px-4 py-6 sm:px-8">
        <div className="sticky top-14 z-10 -mx-4 border-b border-[#eeeeee] bg-[#f9fafb]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <StepIndicator current={step} />
        </div>

        <div className="mt-8">
          {step === 1 ? (
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
              <RequestSummary
                area={area}
                person={selectedPerson}
                startup={startup}
                urgency={urgency}
              />
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
                    {startup.summary || "Girişim özeti henüz belirtilmedi."}
                  </p>
                  {startupLoadError ? (
                    <p className="mt-3 rounded-md border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#92400e]">
                      {startupLoadError}
                    </p>
                  ) : null}
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
                      <dt className="text-xs text-[#999]">Profil kaynağı</dt>
                      <dd className="mt-1">
                        {startup.confirmedProfile
                          ? "Onaylanmış girişim profili"
                          : "Organizasyon kaydı"}
                      </dd>
                    </div>
                  </dl>
                  {startup.sourceFilename ? (
                    <p className="mt-3 text-xs text-[#999]">
                      Kaynak: {startup.sourceFilename}
                    </p>
                  ) : null}
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
              {!isMatching ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm text-[#777]">
                  <span>
                    {recommendationMetadata
                      ? "Talep bilgilerini kullanarak mentor sıralamasını yeniden oluşturabilirsiniz."
                      : "Bu talep için mentor önerilerini hazırlayın."}
                  </span>
                  <PrimaryButton onClick={() => void loadRecommendations()}>
                    {recommendationMetadata
                      ? "Önerileri Yenile"
                      : "Önerileri Hazırla"}
                  </PrimaryButton>
                </div>
              ) : null}
              {isMatching ? (
                <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-white p-5 text-sm text-[#777]">
                  Talep bilgileriniz analiz ediliyor ve uygun mentorlar
                  sıralanıyor…
                </div>
              ) : null}
              {matchingError ? (
                <div className="mb-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]">
                  {matchingError}
                </div>
              ) : null}
              {mentorLoadError ? (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#991b1b]"
                >
                  Mentorlar backend&apos;den yüklenemedi. {mentorLoadError}
                </div>
              ) : null}
              {!mentorLoadError && availableMentors.length === 0 ? (
                <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 text-center text-sm text-[#777]">
                  Bu talep için görüntülenecek uygun mentor bulunamadı.
                </div>
              ) : null}
              <div className="space-y-3">
                {availableMentors.map((item) => (
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
                      {item.recommendationEvidence.length > 0 ? (
                        <div className="mt-3 border-t border-[#e5e7eb] pt-3">
                          <strong className="text-xs text-[#374151]">
                            Onaylanmış mentor profilinden kanıt
                          </strong>
                          <div className="mt-2 space-y-2">
                            {item.recommendationEvidence.map((evidence) => (
                              <blockquote
                                key={`${evidence.profileVersion}-${evidence.claim}`}
                                className="border-l-2 border-[#9ca3af] pl-3 text-xs text-[#6b7280]"
                              >
                                <p>“{evidence.quote}”</p>
                                <footer className="mt-1 text-[11px] text-[#9ca3af]">
                                  {evidence.claim} · {evidence.profileVersion}
                                  {evidence.sourcePage
                                    ? ` · Sayfa ${evidence.sourcePage}`
                                    : ""}
                                </footer>
                              </blockquote>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton
                        href={`/mentors/compare?mentor=${item.id}`}
                      >
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

          {step === 5 ? (
            <div className="mx-auto max-w-3xl space-y-4">
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
                <div className="flex items-center gap-3">
                  <Avatar initials={selectedMentor?.initials ?? "?"} />
                  <div className="flex-1">
                    <p className="text-xs text-[#999]">Seçilen Mentor</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      {selectedMentor?.fullName ?? "Mentor seçilmedi"}
                    </h2>
                    <p className="mt-1 text-xs text-[#777]">
                      {selectedMentor
                        ? `${selectedMentor.professionalTitle} · ${selectedMentor.company}`
                        : "Lütfen önce bir mentor seçin"}
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
                    <dd className="mt-1 whitespace-pre-wrap">{summary}</dd>
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
                  value={effectiveRequesterMessage}
                  onChange={(event) => setRequesterMessage(event.target.value)}
                  className="mt-3 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm outline-none"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between border-t border-[#eee] bg-[#f9fafb]/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <SecondaryButton
            href={step === 1 ? "/dashboard" : undefined}
            onClick={step === 1 ? undefined : () => goToStep(step - 1)}
          >
            Geri
          </SecondaryButton>
          {step < 5 ? (
            <PrimaryButton
              disabled={
                (step === 1 && (!summary.trim() || !urgency)) ||
                (step === 4 &&
                  (isMatching || !selectedMentor || !recommendationMetadata))
              }
              onClick={() => goToStep(step + 1)}
            >
              Devam Et ›
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={submitRequest}
              disabled={isSubmitting || !recommendationMetadata}
            >
              {isSubmitting ? "Kaydediliyor..." : "Talebi Gönder"}
            </PrimaryButton>
          )}
        </div>
        {submissionError ? (
          <p
            className="mx-auto mt-3 max-w-3xl text-right text-sm text-[#b42318]"
            role="alert"
          >
            {submissionError}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function RequestSummary({
  area,
  person,
  startup,
  urgency,
}: {
  area: string;
  person: string;
  startup: StartupContext;
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
          <dd className="mt-1">
            {startup.name}
            {startup.stage ? ` · ${startup.stage}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Aciliyet</dt>
          <dd className="mt-1">{urgency}</dd>
        </div>
      </dl>
    </aside>
  );
}
