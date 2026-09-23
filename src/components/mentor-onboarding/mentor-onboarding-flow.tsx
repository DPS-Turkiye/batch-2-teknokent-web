"use client";

import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import { MentorAreasStep } from "@/components/mentor-onboarding/steps/areas-step";
import { MentorAvailabilityStep } from "@/components/mentor-onboarding/steps/availability-step";
import { MentorProfileStep } from "@/components/mentor-onboarding/steps/profile-step";
import { MentorReviewStep } from "@/components/mentor-onboarding/steps/review-step";
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingRail,
  OnboardingTopbar,
} from "@/components/onboarding/onboarding-layout";
import { OnboardingSubmittedView } from "@/components/onboarding/onboarding-submitted";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import {
  IntroPhase,
  MENTOR_STEP_ORDER,
  MENTOR_STEPS,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";

const TONE = OnboardingTone.Mentor;

const STEP_COPY: Record<
  MentorOnboardingStep,
  { title: string; subtitle: string; note: string }
> = {
  [MentorOnboardingStep.Profile]: {
    title: "Uzmanlık profilini oluştur",
    subtitle: "Startuplar mentor havuzunda seni bu bilgilerle görecek.",
    note: "Uzmanlık profilin, koordinatör onayından sonra tüm startuplar tarafından mentor havuzunda görülür.",
  },
  [MentorOnboardingStep.Areas]: {
    title: "Hangi konularda mentorluk vereceksin?",
    subtitle:
      "Startupların sana gönderdiği talepler bu seçimlere göre filtrelenir.",
    note: "Seçtiğin alanlar mentor havuzundaki filtrelerde ve “bu mentor neden önerildi” açıklamasında kullanılır.",
  },
  [MentorOnboardingStep.Availability]: {
    title: "Müsaitliğini ve kapasiteni belirle",
    subtitle:
      "Startuplar yalnızca açık bıraktığın saatler için görüşme önerebilir.",
    note: "Müsaitliğin startuplara yalnızca boş slot olarak görünür; takvimindeki diğer görüşmeler gizlidir.",
  },
  [MentorOnboardingStep.Review]: {
    title: "Gözden geçir ve gönder",
    subtitle:
      "Startupların mentor havuzunda göreceği profil bu. Gönderdikten sonra düzenleyebilirsin.",
    note: "Profilin önce koordinatör tarafından incelenir, onaylandıktan sonra mentor havuzunda yayınlanır.",
  },
};

const NEXT_STEPS = [
  "Onaylandığında profilin mentor havuzunda yayınlanır ve startuplar sana mentorluk talebi gönderebilir.",
  "Gelen talepleri Mentorluklarım altındaki Talepler sekmesinden inceleyip kabul edersin.",
  "Müsaitliğini ve kapasiteni istediğin zaman profilinden güncelleyebilirsin.",
];

export function MentorOnboardingFlow({ fullName = "" }: { fullName?: string }) {
  const wizard = useMentorOnboarding({ fullName });
  const { step, phase } = wizard;
  const { exit, exiting } = useOnboardingExit(wizard.saveDraft);

  if (wizard.submittedAt) {
    return (
      <OnboardingSubmittedView
        tone={TONE}
        name={`${wizard.draft.firstName} ${wizard.draft.lastName}`.trim()}
        title="Mentor profilin koordinatöre gönderildi"
        submittedAt={wizard.submittedAt}
        lastStepLabel="Mentor profilin havuza alınır"
        nextSteps={NEXT_STEPS}
        onSignOut={exit}
        signingOut={exiting}
      />
    );
  }

  const copy = STEP_COPY[step];
  const onFormScreen =
    step !== MentorOnboardingStep.Profile || phase === IntroPhase.Review;

  return (
    <OnboardingLayout
      topbar={
        <OnboardingTopbar
          tone={TONE}
          exitLabel="Kaydet ve çık"
          onExit={exit}
          exiting={exiting}
        />
      }
      rail={
        <OnboardingRail
          tone={TONE}
          steps={MENTOR_STEPS}
          currentIndex={MENTOR_STEP_ORDER.indexOf(step)}
          note={copy.note}
          showProgress
          onStepClick={(index) => wizard.goToStep(MENTOR_STEP_ORDER[index])}
        />
      }
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <OnboardingFooter
          tone={TONE}
          onBack={wizard.goBack}
          backDisabled={wizard.isFirstScreen || wizard.isSaving}
          onSaveDraft={wizard.saveDraft}
          saveDisabled={wizard.isSaving}
          primaryLabel={
            wizard.isSaving
              ? "Gönderiliyor…"
              : wizard.isLastStep
                ? "Koordinatöre gönder"
                : "Devam et"
          }
          onPrimary={wizard.isLastStep ? wizard.complete : wizard.goNext}
          primaryDisabled={
            wizard.isSaving || !onFormScreen || !wizard.canContinue
          }
          status={
            wizard.draftSavedAt ? (
              <span role="status" className="text-xs text-[#676e78]">
                Taslak kaydedildi.
              </span>
            ) : null
          }
        />
      }
    >
      <RestoredDraftNotice droppedFiles={wizard.droppedFiles} />
      {step === MentorOnboardingStep.Profile ? (
        <MentorProfileStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Areas ? (
        <MentorAreasStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Availability ? (
        <MentorAvailabilityStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Review ? (
        <MentorReviewStep wizard={wizard} />
      ) : null}
      {wizard.saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {wizard.saveError}
        </p>
      ) : null}
    </OnboardingLayout>
  );
}
