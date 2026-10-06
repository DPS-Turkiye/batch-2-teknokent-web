"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { RegisterForm, RegisteredAccount } from "@/interfaces/auth";
import { UserRole } from "@/interfaces/session";
import { SignupRole } from "@/interfaces/signup";
import { ClientApiError } from "@/lib/client/api";
import { fetchAccountStatus, registerMentor } from "@/lib/client/auth";
import {
  createFirebaseAccount,
  currentFirebaseAccount,
  currentIdToken,
  isCurrentEmailVerified,
} from "@/lib/firebase/auth";

export enum MentorRegistration {
  Idle = "idle",
  Loading = "loading",
  Ready = "ready",
  Error = "error",
}

/** The name the backend already has for this login, or "" when it has no account yet. */
async function registeredFullName() {
  try {
    const idToken = await currentIdToken();
    return idToken ? (await fetchAccountStatus(idToken)).fullName : "";
  } catch {
    return "";
  }
}

function roleFromParam(value: string | null) {
  return Object.values(SignupRole).find((role) => role === value) ?? null;
}

/**
 * /signup: role page → account form → e-mail check → wizard. `?resume=1` means the
 * person already has a Firebase account whose registration never finished.
 */
export function useSignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResuming = searchParams.get("resume") === "1";
  const programInvite = searchParams.get("programInvite") ?? undefined;
  const [role, setRole] = useState<SignupRole | null>(() =>
    roleFromParam(searchParams.get("role")),
  );
  const [account, setAccount] = useState<RegisteredAccount | null>(null);
  const [authReady, setAuthReady] = useState(!isResuming);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [mentorRegistration, setMentorRegistration] = useState(
    MentorRegistration.Idle,
  );
  const [mentorRegistrationError, setMentorRegistrationError] = useState("");

  const isMentor = role === SignupRole.Mentor;

  useEffect(() => {
    if (!isResuming) return;
    let active = true;
    void (async () => {
      const firebaseAccount = await currentFirebaseAccount();
      // Signup never sets the Firebase display name, so the name lives on the
      // backend account; without it the mentor is asked for it all over again.
      const fullName =
        firebaseAccount?.fullName.trim() ||
        (firebaseAccount ? await registeredFullName() : "");
      if (!active) return;
      if (firebaseAccount) {
        setNeedsEmailVerification(!firebaseAccount.verified);
        setAccount({ email: firebaseAccount.email, fullName, phone: "" });
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, [isResuming]);

  const chooseRole = useCallback(
    (next: SignupRole) => {
      setRole(next);
      const params = new URLSearchParams({ role: next });
      if (isResuming) params.set("resume", "1");
      if (programInvite) params.set("programInvite", programInvite);
      router.replace(`/signup?${params.toString()}`);
    },
    [isResuming, programInvite, router],
  );

  const finishAfterEmail = useCallback(async () => {
    setNeedsEmailVerification(false);
  }, []);

  const ensureMentorRegistration = useCallback(async () => {
    if (!account?.fullName.trim()) return;
    setMentorRegistration(MentorRegistration.Loading);
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
            programInvite,
          },
          idToken,
        );
      }
      setMentorRegistration(MentorRegistration.Ready);
    } catch (error) {
      setMentorRegistrationError(
        error instanceof Error ? error.message : "Mentor hesabı tamamlanamadı.",
      );
      setMentorRegistration(MentorRegistration.Error);
    }
  }, [account, programInvite]);

  useEffect(() => {
    if (
      account &&
      isMentor &&
      !needsEmailVerification &&
      mentorRegistration === MentorRegistration.Idle
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

  const retryMentorRegistration = useCallback(
    () => setMentorRegistration(MentorRegistration.Idle),
    [],
  );

  const createAccount = useCallback(
    async (form: RegisterForm) => {
      const created: RegisteredAccount = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      await createFirebaseAccount(form.email, form.password);
      const verified = isCurrentEmailVerified();
      setNeedsEmailVerification(!verified);
      setAccount(created);
      if (verified) await finishAfterEmail();
    },
    [finishAfterEmail],
  );

  return {
    role,
    isMentor,
    account,
    authReady,
    needsEmailVerification,
    mentorRegistration,
    mentorRegistrationError,
    chooseRole,
    createAccount,
    finishAfterEmail,
    setAccount,
    retryMentorRegistration,
  };
}
