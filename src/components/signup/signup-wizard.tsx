"use client";

import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingRail,
  OnboardingTopbar,
} from "@/components/onboarding/onboarding-layout";
import { OnboardingSubmittedView } from "@/components/onboarding/onboarding-submitted";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { DocumentsStep } from "@/components/signup/steps/documents-step";
import { PersonalProfileStep } from "@/components/signup/steps/personal-profile-step";
import { ReviewStep } from "@/components/signup/steps/review-step";
import { StartupProfileStep } from "@/components/signup/steps/startup-profile-step";
import {
  signupFullName,
  useFounderApplication,
} from "@/hooks/use-founder-application";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import {
  SIGNUP_STEP_ORDER,
  SIGNUP_STEPS,
  SignupStep,
} from "@/interfaces/signup";

const TONE = OnboardingTone.Mentee;

const STEP_COPY: Record<SignupStep, { title: string; subtitle: string }> = {
  [SignupStep.PersonalProfile]: {
    title: "Kişisel profilini oluştur",
    subtitle:
      "Mentorlar seni bu bilgilerle tanıyacak. Sonradan düzenleyebilirsin.",
  },
  [SignupStep.StartupProfile]: {
    title: "Startup profilini oluştur",
    subtitle: "Koordinatör ve mentorlar startupını bu sayfadan tanıyacak.",
  },
  [SignupStep.Documents]: {
    title: "Dosyalarını yükle",
    subtitle:
      "Hepsi isteğe bağlı. Yüklediklerin ilk görüşmeyi çok hızlandırır.",
  },
  [SignupStep.Review]: {
    title: "Gözden geçir ve gönder",
    subtitle:
      "Koordinatöre göndermeden önce bilgileri kontrol et. Gönderdikten sonra düzenleme talebi gerekebilir.",
  },
};

const RAIL_NOTE =
  "Kişisel profilin yalnızca eşleştiğin mentorlar ve program koordinatörü tarafından görülür.";

const NEXT_STEPS = [
  "Onaylanırsa startupın mentor havuzunda görünür ve mentorlara talep gönderebilirsin.",
  "Düzenleme istenirse e-postayla bilgilendirilirsin; talep edilen alanlar profilde işaretli gelir.",
  "İnceleme sürerken profilde büyük değişiklik yapamazsın, dosya eklemeye devam edebilirsin.",
];

export function SignupWizardView({ account }: { account: RegisteredAccount }) {
  const { submitApplication, submittedAt } = useFounderApplication(account);
  const wizard = useSignupWizard({ onSubmit: submitApplication });
  const { step, canContinue, isFirstStep, isLastStep } = wizard;
  const { exit, exiting } = useOnboardingExit(wizard.saveDraft);

  if (wizard.submitted) {
    const startupName = wizard.draft.startup.name.trim();
    return (
      <OnboardingSubmittedView
        tone={TONE}
        name={startupName || signupFullName(wizard.draft)}
        title={`${startupName || "Startup"} profili koordinatöre gönderildi`}
        submittedAt={submittedAt ?? new Date()}
        lastStepLabel="Startup profilin yayına alınır"
        nextSteps={NEXT_STEPS}
        onSignOut={exit}
        signingOut={exiting}
      />
    );
  }

  const currentIndex = SIGNUP_STEP_ORDER.indexOf(step);

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
          steps={SIGNUP_STEPS}
          currentIndex={currentIndex}
          note={RAIL_NOTE}
          onStepClick={(index) => wizard.goToStep(SIGNUP_STEP_ORDER[index])}
        />
      }
      title={STEP_COPY[step].title}
      subtitle={STEP_COPY[step].subtitle}
      footer={
        <OnboardingFooter
          tone={TONE}
          onBack={wizard.goBack}
          backDisabled={isFirstStep || wizard.submitting}
          onSaveDraft={wizard.saveDraft}
          saveDisabled={wizard.submitting}
          primaryLabel={
            wizard.submitting
              ? "Gönderiliyor…"
              : isLastStep
                ? "Koordinatöre gönder"
                : "Devam et"
          }
          onPrimary={isLastStep ? wizard.submit : wizard.goNext}
          primaryDisabled={wizard.submitting || !canContinue}
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
      {step === SignupStep.PersonalProfile ? (
        <PersonalProfileStep wizard={wizard} />
      ) : null}
      {step === SignupStep.StartupProfile ? (
        <StartupProfileStep wizard={wizard} />
      ) : null}
      {step === SignupStep.Documents ? <DocumentsStep wizard={wizard} /> : null}
      {step === SignupStep.Review ? <ReviewStep wizard={wizard} /> : null}
      {wizard.submitError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {wizard.submitError}
        </p>
      ) : null}
    </OnboardingLayout>
  );
}
