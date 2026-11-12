"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterView } from "@/components/auth/register-view";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { RoleSelectView } from "@/components/signup/role-select-view";
import { SignupWizardView } from "@/components/signup/signup-wizard";
import { MentorRegistration, useSignupFlow } from "@/hooks/use-signup-flow";
import type { RegisteredAccount } from "@/interfaces/auth";

function ResumeMentorIdentity({
  account,
  onContinue,
}: {
  account: RegisteredAccount;
  onContinue: (account: RegisteredAccount) => void;
}) {
  const t = useTranslations();
  const copy = useTranslations("signupFlow");
  const [fullName, setFullName] = useState(account.fullName);
  const [phone, setPhone] = useState(account.phone);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) return;
    onContinue({ ...account, fullName: fullName.trim(), phone: phone.trim() });
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-4 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          {copy("resumeTitle")}
        </h1>
        <p className="text-center text-sm text-[#6b7280]">
          {copy("resumeIntro")}
        </p>
        <label className="text-sm font-medium text-[#111827]">
          {copy("fullName")} <span className="text-[#e5701d]">*</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 h-11 w-full rounded-[10px] border border-[#e8eaed] px-3 outline-none focus:border-[#e5701d]"
          />
        </label>
        <label className="text-sm font-medium text-[#111827]">
          {t("auth.phone")}
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 h-11 w-full rounded-[10px] border border-[#e8eaed] px-3 outline-none focus:border-[#e5701d]"
          />
        </label>
        <button
          type="submit"
          disabled={!fullName.trim()}
          className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white disabled:opacity-50"
        >
          {copy("resumeSubmit")}
        </button>
      </form>
    </AuthShell>
  );
}

function ResumeLoading({ message }: { message: string }) {
  return (
    <AuthShell>
      <p role="status" className="py-12 text-center text-sm text-[#6b7280]">
        {message}
      </p>
    </AuthShell>
  );
}

// TEST UI: placeholder until the design team's screen; replace when it arrives.
function ExistingAccountNotice({ email }: { email: string }) {
  const copy = useTranslations("signupFlow");
  return (
    <AuthShell>
      <div className="flex flex-col gap-4 py-10 text-center">
        <h1 className="text-2xl font-bold leading-9 text-[#111827]">
          {copy("existingAccountTitle")}
        </h1>
        <p className="text-sm text-[#6b7280]">
          {copy("existingAccountBody", { email })}
        </p>
        <Link
          href="/login"
          className="mx-auto rounded-[10px] bg-[#e5701d] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copy("existingAccountSignIn")}
        </Link>
      </div>
    </AuthShell>
  );
}

export function SignupFlow() {
  const copy = useTranslations("signupFlow");
  const flow = useSignupFlow();
  const { account, isMentor, mentorRegistration } = flow;

  if (!flow.authReady) {
    return <ResumeLoading message={copy("checkingSession")} />;
  }

  if (account && flow.needsEmailVerification) {
    return (
      <VerifyEmailView
        email={account.email}
        onVerified={flow.finishAfterEmail}
      />
    );
  }

  if (flow.role === null) {
    return (
      <RoleSelectView signedIn={Boolean(account)} onChoose={flow.chooseRole} />
    );
  }

  if (!account) {
    return <RegisterView isMentor={isMentor} onSubmit={flow.createAccount} />;
  }

  if (isMentor && !account.fullName.trim()) {
    return (
      <ResumeMentorIdentity account={account} onContinue={flow.setAccount} />
    );
  }

  if (isMentor && mentorRegistration !== MentorRegistration.Ready) {
    if (mentorRegistration === MentorRegistration.Error) {
      return (
        <AuthShell>
          <div className="py-10 text-center">
            <p role="alert" className="text-sm text-[#b42318]">
              {flow.mentorRegistrationError}
            </p>
            <button
              type="button"
              onClick={flow.retryMentorRegistration}
              className="mt-4 rounded-[10px] bg-[#e5701d] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {copy("retry")}
            </button>
          </div>
        </AuthShell>
      );
    }
    return <ResumeLoading message={copy("preparingMentor")} />;
  }

  if (!isMentor && flow.existingAccount) {
    return <ExistingAccountNotice email={account.email} />;
  }

  return isMentor ? (
    <MentorOnboardingFlow fullName={account.fullName} />
  ) : (
    <SignupWizardView account={account} />
  );
}
