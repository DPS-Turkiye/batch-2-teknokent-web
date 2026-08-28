"use client";

import { FormEvent, useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoginFlowStep } from "@/interfaces/login";
import { ClientApiError } from "@/lib/client/api";
import {
  describeAuthError,
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

export function useLoginFlow() {
  const { login, logout } = useSession();
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    logout()
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setLoginError("Enter your email to receive a password reset link.");
      return;
    }
    try {
      await requestPasswordReset(email);
      setNotice("A password reset link was sent to your email.");
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
