"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupWizardView } from "@/components/signup/signup-wizard";

export function SignupFlow() {
  const searchParams = useSearchParams();
  const isMentor = searchParams.get("role") === "mentor";
  const [accountCreated, setAccountCreated] = useState(false);

  if (!accountCreated) {
    return (
      <RegisterView
        isMentor={isMentor}
        onContinue={() => setAccountCreated(true)}
      />
    );
  }
  return isMentor ? <MentorOnboardingFlow /> : <SignupWizardView />;
}
