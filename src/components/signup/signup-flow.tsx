"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupWizardView } from "@/components/signup/signup-wizard";
import type { RegisterForm, RegisteredAccount } from "@/interfaces/auth";
import { registerMentor } from "@/lib/client/auth";
import { createFirebaseAccount, currentUserEmail } from "@/lib/firebase/auth";

export function SignupFlow() {
  const searchParams = useSearchParams();
  const isMentor = searchParams.get("role") === "mentor";
  const isResuming = searchParams.get("resume") === "1";
  // A signup interrupted after the Firebase account was created leaves no
  // backend user. Resuming drops the visitor straight back into the wizard;
  // their name is collected again in its first step.
  const [account, setAccount] = useState<RegisteredAccount | null>(() => {
    if (!isResuming) return null;
    const email = currentUserEmail();
    return email ? { fullName: "", email, phone: "" } : null;
  });

  async function createAccount(form: RegisterForm) {
    const created: RegisteredAccount = {
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    const idToken = await createFirebaseAccount(form.email, form.password);
    if (isMentor) {
      await registerMentor(
        {
          fullName: created.fullName,
          email: created.email,
          phone: created.phone || undefined,
        },
        idToken,
      );
    }

    setAccount(created);
  }

  if (!account) {
    return <RegisterView isMentor={isMentor} onSubmit={createAccount} />;
  }
  return isMentor ? (
    <MentorOnboardingFlow />
  ) : (
    <SignupWizardView account={account} />
  );
}
