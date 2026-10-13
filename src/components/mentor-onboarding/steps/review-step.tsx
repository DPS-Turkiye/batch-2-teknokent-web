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
import { useLocale, useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentor;

export function MentorReviewStep({ wizard }: { wizard: MentorOnboarding }) {
  const locale = useLocale();
  const copy = useTranslations("mentorReview");
  const { draft, goToStep } = wizard;
  const { profile } = draft;
  const capacity = weeklyCapacity(draft);
  const roles = profile.history.filter((role) => role.title.trim()).length;

  return (
    <>
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title={copy("profile")}
        onEdit={() => goToStep(MentorOnboardingStep.Profile)}
        rows={[
          {
            label: copy("fullName"),
            value: `${draft.firstName} ${draft.lastName}`.trim(),
          },
          { label: copy("title"), value: profile.title.trim() },
          {
            label: copy("companyExperience"),
            value: [profile.company.trim(), profile.totalExperience.trim()]
              .filter(Boolean)
              .join(" · "),
          },
          { label: copy("about"), value: truncate(draft.about.trim(), 64) },
          {
            label: copy("experience"),
            value: roles ? copy("rolesAdded", { count: roles }) : "",
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title={copy("areas")}
        onEdit={() => goToStep(MentorOnboardingStep.Areas)}
        rows={[
          { label: copy("topics"), value: draft.topics.join(", ") },
          { label: copy("stage"), value: draft.stages.join(", ") },
          {
            label: copy("offerings"),
            value: draft.offerings.length
              ? copy("offeringCount", { count: draft.offerings.length })
              : "",
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        rounded="rounded-xl"
        title={copy("availability")}
        onEdit={() => goToStep(MentorOnboardingStep.Availability)}
        rows={[
          { label: copy("weekly"), value: weekSummary(draft.week) },
          {
            label: copy("concurrent"),
            value: copy("capacityValue", { count: draft.capacity }),
          },
          {
            label: copy("meeting"),
            value: [
              `${draft.durationMinutes} dk`,
              MEETING_FREQUENCY_LABELS[draft.frequency],
              draft.format,
            ].join(" · "),
          },
          { label: copy("responseTime"), value: draft.responseTime },
        ]}
      />
      <OnboardingNote
        tone={TONE}
        icon="/onboarding/info-done-blue.svg"
        title={copy("hoursTitle", {
          hours: capacity.hours.toLocaleString(locale),
        })}
      >
        {copy("hoursBody", {
          minutes: draft.durationMinutes,
          meetings: capacity.meetings,
        })}
      </OnboardingNote>
      <OnboardingConsent
        tone={TONE}
        checked={draft.consent}
        onChange={(value) => wizard.update("consent", value)}
      >
        {copy("consent")}
      </OnboardingConsent>
    </>
  );
}
