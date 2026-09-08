"use client";

import Link from "next/link";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { DocumentsStep } from "@/components/signup/steps/documents-step";
import { PersonalProfileStep } from "@/components/signup/steps/personal-profile-step";
import { ReviewStep } from "@/components/signup/steps/review-step";
import { StartupProfileStep } from "@/components/signup/steps/startup-profile-step";
import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import { SubmittedView } from "@/components/signup/submitted-view";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import {
  SIGNUP_STEP_CTA,
  SIGNUP_STEP_LABELS,
  SIGNUP_STEP_ORDER,
  SignupStep,
  type SignupDraft,
} from "@/interfaces/signup";
import { registerFounder } from "@/lib/client/auth";
import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

const STEP_WIDTH: Record<SignupStep, string> = {
  [SignupStep.PersonalProfile]: "max-w-[680px]",
  [SignupStep.StartupProfile]: "max-w-[1080px]",
  [SignupStep.Documents]: "max-w-[1080px]",
  [SignupStep.Review]: "max-w-[680px]",
};

function Stepper({ current }: { current: SignupStep }) {
  return (
    <nav aria-label="Profil kurulum adımları">
      <ol className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {SIGNUP_STEP_ORDER.map((step) => {
          const isCurrent = step === current;
          return (
            <li key={step} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  isCurrent
                    ? "bg-[#e86f22] text-white"
                    : "bg-[#e4e7ea] text-[#858c96]"
                }`}
              >
                {step}
              </span>
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`text-sm ${
                  isCurrent ? "font-semibold text-[#e86f22]" : "text-[#a4aab2]"
                }`}
              >
                {SIGNUP_STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SignupWizardView({ account }: { account: RegisteredAccount }) {
  async function submitApplication(draft: SignupDraft) {
    const idToken = await currentIdToken();
    if (!idToken) {
      throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
    }
    const draftName = [draft.personal.firstName, draft.personal.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

    await registerFounder(
      {
        fullName: draftName || account.fullName,
        email: account.email,
        phone: account.phone || undefined,
        organizationName: draft.startup.name.trim(),
        description: draft.startup.tagline.trim() || undefined,
        jobTitle: draft.personal.role.trim() || undefined,
        programId: draft.startup.programId,
        bio: draft.personal.bio.trim() || undefined,
        linkedinUrl: draft.personal.linkedin.trim() || undefined,
        expertise: draft.personal.expertise,
        website: draft.startup.website.trim() || undefined,
        problem: draft.startup.problem.trim() || undefined,
        solution: draft.startup.solution.trim() || undefined,
        currentSolution: draft.startup.currentSolution.trim() || undefined,
        targetUser: draft.startup.targetUser.trim() || undefined,
        sector: draft.startup.sector.trim() || undefined,
        maturity: draft.startup.maturity.trim() || undefined,
        programLevel: draft.startup.programLevel.trim() || undefined,
        supportAreas: draft.startup.supportAreas,
      },
      idToken,
    );
    if (draft.personal.cv?.file) {
      await uploadDocument(draft.personal.cv.file, "cv", idToken);
    }
    if (draft.startup.logo?.file) {
      await uploadDocument(draft.startup.logo.file, "logo", idToken);
    }
    for (const [kind, uploaded] of Object.entries(draft.documents)) {
      if (uploaded?.file) {
        await uploadDocument(uploaded.file, kind, idToken);
      }
    }
  }

  const wizard = useSignupWizard({ onSubmit: submitApplication });
  const { step, submitted, canContinue, isFirstStep, isLastStep } = wizard;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#22262b]">
      <header className="border-b border-[#e4e7ea] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="text-[22px] font-black tracking-[-0.08em] text-[#e5701d]"
            aria-label="metual ana sayfa"
          >
            metual
          </Link>
          <span className="ml-auto rounded-full border border-[#e4e7ea] px-3 py-1.5 text-xs text-[#676e78]">
            Profil kurulumu
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">
        {submitted ? (
          <SubmittedView draft={wizard.draft} />
        ) : (
          <>
            <Stepper current={step} />

            <RestoredDraftNotice droppedFiles={wizard.droppedFiles} />

            <div className={`mx-auto w-full ${STEP_WIDTH[step]}`}>
              <div className="mt-8">
                {step === SignupStep.PersonalProfile ? (
                  <PersonalProfileStep wizard={wizard} />
                ) : null}
                {step === SignupStep.StartupProfile ? (
                  <StartupProfileStep wizard={wizard} />
                ) : null}
                {step === SignupStep.Documents ? (
                  <DocumentsStep wizard={wizard} />
                ) : null}
                {step === SignupStep.Review ? (
                  <ReviewStep wizard={wizard} />
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <SecondaryButton
                  onClick={wizard.goBack}
                  disabled={isFirstStep || wizard.submitting}
                >
                  Geri
                </SecondaryButton>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Saving a draft or stepping back mid-submit races the
                      submission already in flight. */}
                  <SecondaryButton
                    onClick={wizard.saveDraft}
                    disabled={wizard.submitting}
                  >
                    Taslak olarak kaydet
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={isLastStep ? wizard.submit : wizard.goNext}
                    disabled={
                      wizard.submitting || (!isLastStep && !canContinue)
                    }
                  >
                    {wizard.submitting
                      ? "Gönderiliyor…"
                      : SIGNUP_STEP_CTA[step]}
                  </PrimaryButton>
                </div>
              </div>
              {wizard.submitError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {wizard.submitError}
                </p>
              ) : null}
              {wizard.draftSavedAt ? (
                <p
                  role="status"
                  className="mt-3 text-right text-xs text-[#676e78]"
                >
                  Taslak kaydedildi.
                </p>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
