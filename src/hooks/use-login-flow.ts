"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoginFlowStep } from "@/interfaces/login";
import { ClientApiError } from "@/lib/client/api";
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

export function useLoginFlow() {
  const router = useRouter();
  const { login } = useSession();
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
    try {
      const idToken = await signInToFirebase(email, password, rememberMe);
      if (!isCurrentEmailVerified()) {
        setNeedsEmailVerification(true);
        setStep(LoginFlowStep.Login);
        return;
      }
      await login(idToken, rememberMe);
      setStep(LoginFlowStep.Verified);
    } catch (error) {
      if (error instanceof ClientApiError) {
        if (error.code === ACCOUNT_NOT_APPROVED) {
          router.push("/application-status");
          return;
        }
        if (error.code === REGISTRATION_REQUIRED) {
          router.push("/signup?resume=1");
          return;
        }
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
    rememberMe,
    setRememberMe,
    loginError,
    notice,
    submitLogin,
    sendPasswordReset,
    needsEmailVerification,
    continueAfterEmailVerified: async () => {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      }
      await login(idToken, rememberMe);
      setNeedsEmailVerification(false);
      setStep(LoginFlowStep.Verified);
    },
    isReady,
    isVerifying: step === LoginFlowStep.Verifying,
    isVerified: step === LoginFlowStep.Verified,
  };
}
