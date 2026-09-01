"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoginFlowStep } from "@/interfaces/login";
import { ClientApiError } from "@/lib/client/api";
import {
  describeAuthError,
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

export const ACCOUNT_NOT_APPROVED = "ACCOUNT_NOT_APPROVED";
export const REGISTRATION_REQUIRED = "REGISTRATION_REQUIRED";

export function useLoginFlow() {
  const router = useRouter();
  const { login } = useSession();
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");

  // Nothing to prepare: the form is usable immediately. This used to await a
  // logout on mount, which let a second tab sitting on /login sign out an
  // authenticated tab - the cookie and Firebase session are shared across tabs.
  // Logout is an explicit action only.
  const isReady = true;

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady) return;
    setLoginError("");
    setNotice("");
    setStep(LoginFlowStep.Verifying);
    try {
      const idToken = await signInToFirebase(email, password, rememberMe);
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
    isReady,
    isVerifying: step === LoginFlowStep.Verifying,
    isVerified: step === LoginFlowStep.Verified,
  };
}
