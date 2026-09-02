"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupWizardView } from "@/components/signup/signup-wizard";
import type { RegisterForm, RegisteredAccount } from "@/interfaces/auth";
import { registerMentor } from "@/lib/client/auth";
import {
  createFirebaseAccount,
  currentIdToken,
  currentUserEmail,
  isCurrentEmailVerified,
} from "@/lib/firebase/auth";

type SignupKind = "founder" | "mentor";

function ResumeRolePicker({
  email,
  onChoose,
}: {
  email: string;
  onChoose: (kind: SignupKind) => void;
}) {
  return (
    <AuthShell>
      <div className="flex flex-col gap-4 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          Kaydını nasıl tamamlayacaksın?
        </h1>
        <p className="text-center text-sm text-[#6b7280]">
          {email} ile giriş yaptın ama hesap kaydı bitmemiş. Startup mı, mentor
          mu olduğunu seç.
        </p>
        <button
          type="button"
          onClick={() => onChoose("founder")}
          className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white hover:bg-[#ce5e19]"
        >
          Startup olarak devam et
        </button>
        <button
          type="button"
          onClick={() => onChoose("mentor")}
          className="h-[46px] w-full rounded-[10px] border border-[#e8eaed] text-sm font-semibold text-[#111827] hover:border-[#e5701d]"
        >
          Mentor olarak devam et
        </button>
      </div>
    </AuthShell>
  );
}

export function SignupFlow() {
  const searchParams = useSearchParams();
  const urlIsMentor = searchParams.get("role") === "mentor";
  const isResuming = searchParams.get("resume") === "1";
  const [kind, setKind] = useState<SignupKind | null>(() => {
    if (urlIsMentor) return "mentor";
    if (isResuming) return null;
    return "founder";
  });
  const [account, setAccount] = useState<RegisteredAccount | null>(() => {
    if (!isResuming) return null;
    const email = currentUserEmail();
    return email ? { fullName: "", email, phone: "" } : null;
  });
  const [needsEmailVerification, setNeedsEmailVerification] = useState(() =>
    Boolean(isResuming && currentUserEmail() && !isCurrentEmailVerified()),
  );
  const createdThisSession = useRef(false);

  const isMentor = kind === "mentor";

  const finishAfterEmail = useCallback(
    async (created: RegisteredAccount) => {
      if (createdThisSession.current && isMentor) {
        const idToken = await currentIdToken();
        if (!idToken) {
          throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        }
        await registerMentor(
          {
            fullName: created.fullName,
            email: created.email,
            phone: created.phone || undefined,
          },
          idToken,
        );
      }
      setNeedsEmailVerification(false);
    },
    [isMentor],
  );

  async function createAccount(form: RegisterForm) {
    const created: RegisteredAccount = {
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    createdThisSession.current = true;
    await createFirebaseAccount(form.email, form.password);
    setAccount(created);
    if (!isCurrentEmailVerified()) {
      setNeedsEmailVerification(true);
      return;
    }
    await finishAfterEmail(created);
  }

  if (account && needsEmailVerification) {
    return (
      <VerifyEmailView
        email={account.email}
        onVerified={() => finishAfterEmail(account)}
      />
    );
  }

  if (account && kind === null) {
    return <ResumeRolePicker email={account.email} onChoose={setKind} />;
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
