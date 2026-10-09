"use client";

import { useEffect, useRef, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import {
  describeAuthError,
  reloadAndCheckEmailVerified,
  resendVerificationEmail,
} from "@/lib/firebase/auth";
import { useTranslations } from "next-intl";

export function VerifyEmailView({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => Promise<void>;
}) {
  const copy = useTranslations("verifyEmail");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (finishedRef.current) return;
      const verified = await reloadAndCheckEmailVerified();
      if (cancelled || !verified || finishedRef.current) return;
      finishedRef.current = true;
      await onVerified();
    }

    const timer = window.setInterval(() => {
      void poll();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onVerified]);

  async function handleContinue() {
    setChecking(true);
    setError("");
    try {
      const verified = await reloadAndCheckEmailVerified();
      if (!verified) {
        setError(copy("notVerified"));
        return;
      }
      finishedRef.current = true;
      await onVerified();
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setNotice("");
    try {
      await resendVerificationEmail();
      setNotice(copy("resent"));
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-4 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          {copy("title")}
        </h1>
        <p className="text-center text-sm leading-6 text-[#6b7280]">
          {copy("sentBefore")}
          <span className="font-semibold text-[#111827]">{email}</span>
          {copy("sentAfter")}
        </p>

        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={checking}
          className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
        >
          {checking ? copy("checking") : copy("confirm")}
        </button>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="h-[46px] w-full rounded-[10px] border border-[#e8eaed] text-sm font-semibold text-[#111827] hover:border-[#e5701d] disabled:opacity-60"
        >
          {resending ? copy("resending") : copy("resend")}
        </button>

        {notice ? (
          <p
            role="status"
            className="rounded-lg border border-[#f2d3b8] bg-[#fff9f5] px-3 py-2 text-xs text-[#c85816]"
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
