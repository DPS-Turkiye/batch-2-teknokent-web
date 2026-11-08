"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoginFlowStep } from "@/interfaces/login";
import { ClientApiError } from "@/lib/client/api";
import { fetchOnboardingDraft } from "@/lib/client/onboarding-draft";
import { emailCharacterError } from "@/lib/email";
import {
  currentIdToken,
  describeAuthError,
  isCurrentEmailVerified,
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

import { ACCOUNT_NOT_APPROVED, REGISTRATION_REQUIRED } from "@/lib/const";
import { signupResumeHref } from "@/lib/signup-resume";

export function useLoginFlow() {
  const router = useRouter();
  const { login } = useSession();
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const isReady = true;

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady) return;
    setLoginError("");
    setNotice("");
    setStep(LoginFlowStep.Verifying);
    const emailError = emailCharacterError(email);
    if (emailError) {
      setLoginError(emailError);
      setStep(LoginFlowStep.Login);
      return;
    }
    let idToken: string | null = null;
    try {
      idToken = await signInToFirebase(email, password, false);
      if (!isCurrentEmailVerified()) {
        setNeedsEmailVerification(true);
        setStep(LoginFlowStep.Login);
        return;
      }
      await login(idToken);
      setStep(LoginFlowStep.Verified);
    } catch (error) {
      if (await routeAccountNotReady(error, idToken)) return;
      if (error instanceof ClientApiError) {
        await signOutOfFirebase().catch(() => undefined);
      }
      setLoginError(
        error instanceof ClientApiError
          ? error.message
          : describeAuthError(error),
      );
      setStep(LoginFlowStep.Login);
    }
  }

  /**
   * A pending or half-registered account keeps its Firebase session and goes to its status page or saved signup;
   * true when it was routed there.
   */
  async function routeAccountNotReady(error: unknown, idToken: string | null) {
    if (
      !(error instanceof ClientApiError) ||
      (error.code !== ACCOUNT_NOT_APPROVED &&
        error.code !== REGISTRATION_REQUIRED)
    ) {
      return false;
    }
    // A signup saved half-way reopens in its wizard; a finished one clears its draft.
    const draft = idToken
      ? await fetchOnboardingDraft(idToken).catch(() => null)
      : null;
    router.push(
      draft
        ? signupResumeHref(draft.kind)
        : error.code === ACCOUNT_NOT_APPROVED
          ? "/application-status"
          : signupResumeHref(),
    );
    return true;
  }

  async function continueAfterEmailVerified() {
    const idToken = await currentIdToken();
    if (!idToken) {
      throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
    }
    try {
      await login(idToken);
    } catch (error) {
      if (await routeAccountNotReady(error, idToken)) return;
      throw error;
    }
    setNeedsEmailVerification(false);
    setStep(LoginFlowStep.Verified);
  }

  async function sendPasswordReset() {
    setLoginError("");
    setNotice("");
    if (!email.trim()) {
      setLoginError(
        "Şifre sıfırlama bağlantısı için e-posta adresinizi girin.",
      );
      return;
    }
    try {
      await requestPasswordReset(email);
      setNotice("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (error) {
      setLoginError(describeAuthError(error));
    }
  }

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    notice,
    submitLogin,
    sendPasswordReset,
    needsEmailVerification,
    continueAfterEmailVerified,
    isReady,
    isVerifying: step === LoginFlowStep.Verifying,
    isVerified: step === LoginFlowStep.Verified,
  };
}
