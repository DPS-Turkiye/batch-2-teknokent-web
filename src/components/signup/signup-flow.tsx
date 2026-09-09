"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { RegisterView } from "@/components/auth/register-view";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupWizardView } from "@/components/signup/signup-wizard";
import type { RegisterForm, RegisteredAccount } from "@/interfaces/auth";
import { UserRole } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { fetchAccountStatus, registerMentor } from "@/lib/client/auth";
import {
  createFirebaseAccount,
  currentFirebaseAccount,
  currentIdToken,
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

function ResumeMentorIdentity({
  account,
  onContinue,
}: {
  account: RegisteredAccount;
  onContinue: (account: RegisteredAccount) => void;
}) {
  const [fullName, setFullName] = useState(account.fullName);
  const [phone, setPhone] = useState(account.phone);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) return;
    onContinue({ ...account, fullName: fullName.trim(), phone: phone.trim() });
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-4 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          Mentor hesabını tamamla
        </h1>
        <p className="text-center text-sm text-[#6b7280]">
          Mentor profilini açmadan önce hesap bilgilerini tamamla.
        </p>
        <label className="text-sm font-medium text-[#111827]">
          Ad soyad <span className="text-[#e5701d]">*</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 h-11 w-full rounded-[10px] border border-[#e8eaed] px-3 outline-none focus:border-[#e5701d]"
          />
        </label>
        <label className="text-sm font-medium text-[#111827]">
          Telefon
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
          Mentor profiline devam et
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
    return null;
  });
  const [authReady, setAuthReady] = useState(!isResuming);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [mentorRegistration, setMentorRegistration] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [mentorRegistrationError, setMentorRegistrationError] = useState("");

  const isMentor = kind === "mentor";

  useEffect(() => {
    if (!isResuming) return;
    let active = true;
    void currentFirebaseAccount().then((firebaseAccount) => {
      if (!active) return;
      if (firebaseAccount) {
        setNeedsEmailVerification(!firebaseAccount.verified);
        setAccount({
          email: firebaseAccount.email,
          fullName: firebaseAccount.fullName,
          phone: "",
        });
      }
      setAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, [isResuming]);

  const finishAfterEmail = useCallback(async () => {
    setNeedsEmailVerification(false);
  }, []);

  const ensureMentorRegistration = useCallback(async () => {
    if (!account?.fullName.trim()) return;
    setMentorRegistration("loading");
    setMentorRegistrationError("");
    try {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      }
      try {
        const existing = await fetchAccountStatus(idToken);
        if (existing.role !== UserRole.Mentor) {
          throw new Error("Bu e-posta başka bir hesap türüyle kayıtlı.");
        }
      } catch (error) {
        if (!(error instanceof ClientApiError) || error.status !== 401) {
          throw error;
        }
        await registerMentor(
          {
            fullName: account.fullName,
            email: account.email,
            phone: account.phone || undefined,
          },
          idToken,
        );
      }
      setMentorRegistration("ready");
    } catch (error) {
      setMentorRegistrationError(
        error instanceof Error ? error.message : "Mentor hesabı tamamlanamadı.",
      );
      setMentorRegistration("error");
    }
  }, [account]);

  useEffect(() => {
    if (
      account &&
      isMentor &&
      !needsEmailVerification &&
      mentorRegistration === "idle"
    ) {
      void Promise.resolve().then(ensureMentorRegistration);
    }
  }, [
    account,
    ensureMentorRegistration,
    isMentor,
    mentorRegistration,
    needsEmailVerification,
  ]);

  async function createAccount(form: RegisterForm) {
    const created: RegisteredAccount = {
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    await createFirebaseAccount(form.email, form.password);
    const verified = isCurrentEmailVerified();
    setNeedsEmailVerification(!verified);
    setAccount(created);
    if (!verified) {
      return;
    }
    await finishAfterEmail();
  }

  if (!authReady) {
    return <ResumeLoading message="Oturum bilgileri kontrol ediliyor…" />;
  }

  if (account && needsEmailVerification) {
    return (
      <VerifyEmailView email={account.email} onVerified={finishAfterEmail} />
    );
  }

  if (account && kind === null) {
    return <ResumeRolePicker email={account.email} onChoose={setKind} />;
  }

  if (account && isMentor && !account.fullName.trim()) {
    return <ResumeMentorIdentity account={account} onContinue={setAccount} />;
  }

  if (account && isMentor && mentorRegistration !== "ready") {
    if (mentorRegistration === "error") {
      return (
        <AuthShell>
          <div className="py-10 text-center">
            <p role="alert" className="text-sm text-[#b42318]">
              {mentorRegistrationError}
            </p>
            <button
              type="button"
              onClick={() => {
                setMentorRegistration("idle");
              }}
              className="mt-4 rounded-[10px] bg-[#e5701d] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tekrar dene
            </button>
          </div>
        </AuthShell>
      );
    }
    return <ResumeLoading message="Mentor hesabı hazırlanıyor…" />;
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
