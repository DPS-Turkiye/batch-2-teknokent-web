"use client";

import { useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { SignupWizardView } from "@/components/signup/signup-wizard";

/**
 * The new-user journey from the Figma flow: account creation (208:2041)
 * followed by the four-step profile setup (208:2152 - 208:3118).
 */
export function SignupFlow() {
  const [accountCreated, setAccountCreated] = useState(false);

  if (!accountCreated) {
    return <RegisterView onContinue={() => setAccountCreated(true)} />;
  }
  return <SignupWizardView />;
}
