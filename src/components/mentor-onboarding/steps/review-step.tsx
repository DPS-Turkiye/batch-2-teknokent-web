"use client";

import {
  OnboardingConsent,
  OnboardingNote,
  OnboardingReviewCard,
} from "@/components/onboarding/onboarding-ui";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { MEETING_FREQUENCY_LABELS } from "@/interfaces/mentor";
import { MentorOnboardingStep } from "@/interfaces/mentor-onboarding";
import { weekSummary, weeklyCapacity } from "@/lib/mentor-onboarding";
import { truncate } from "@/lib/utils";

const TONE = OnboardingTone.Mentor;

export function MentorReviewStep({ wizard }: { wizard: MentorOnboarding }) {
  const { draft, goToStep } = wizard;
  const { profile } = draft;
  const capacity = weeklyCapacity(draft);
  const roles = profile.history.filter((role) => role.title.trim()).length;

  return (
    <>
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title="Uzmanlık profili"
        onEdit={() => goToStep(MentorOnboardingStep.Profile)}
        rows={[
          {
            label: "Ad soyad",
            value: `${draft.firstName} ${draft.lastName}`.trim(),
          },
          { label: "Unvan", value: profile.title.trim() },
          {
            label: "Kurum · Deneyim",
            value: [profile.company.trim(), profile.totalExperience.trim()]
              .filter(Boolean)
              .join(" · "),
          },
          { label: "Hakkında", value: truncate(draft.about.trim(), 64) },
          { label: "Deneyim", value: roles ? `${roles} görev eklendi` : "" },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title="Mentorluk alanları"
        onEdit={() => goToStep(MentorOnboardingStep.Areas)}
        rows={[
          { label: "Konular", value: draft.topics.join(", ") },
          { label: "Girişim aşaması", value: draft.stages.join(", ") },
          {
            label: "Çalışılabilecek konular",
            value: draft.offerings.length
              ? `${draft.offerings.length} madde`
              : "",
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title="Müsaitlik ve kapasite"
        onEdit={() => goToStep(MentorOnboardingStep.Availability)}
        rows={[
          { label: "Haftalık uygunluk", value: weekSummary(draft.week) },
          { label: "Eş zamanlı mentorluk", value: `${draft.capacity} startup` },
          {
            label: "Görüşme",
            value: [
              `${draft.durationMinutes} dk`,
              MEETING_FREQUENCY_LABELS[draft.frequency],
              draft.format,
            ].join(" · "),
          },
          { label: "Yanıt süresi", value: draft.responseTime },
        ]}
      />
      <OnboardingNote
        tone={TONE}
        icon="/onboarding/info-done-blue.svg"
        title={`Haftada yaklaşık ${capacity.hours.toLocaleString("tr-TR")} saat ayırmış oluyorsun`}
      >
        Seçtiğin uygunluk ve {draft.durationMinutes} dakikalık görüşme süresiyle
        haftada en fazla {capacity.meetings} görüşme planlanabilir. Kapasiteni
        sonradan profilinden değiştirebilirsin.
      </OnboardingNote>
      <OnboardingConsent
        tone={TONE}
        checked={draft.consent}
        onChange={(value) => wizard.update("consent", value)}
      >
        Mentorluk ilkelerini okudum ve kabul ediyorum. Profilimin koordinatör
        tarafından incelenmesini onaylıyorum.
      </OnboardingConsent>
    </>
  );
}
