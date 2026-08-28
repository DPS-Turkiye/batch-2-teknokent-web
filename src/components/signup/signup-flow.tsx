"use client";

import { useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { SignupWizardView } from "@/components/signup/signup-wizard";

export function SignupFlow() {
  const [accountCreated, setAccountCreated] = useState(false);

  if (!accountCreated) {
    return <RegisterView onContinue={() => setAccountCreated(true)} />;
  }
  return <SignupWizardView />;
}
