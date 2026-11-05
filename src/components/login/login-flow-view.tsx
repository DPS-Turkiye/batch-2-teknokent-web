"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { useLoginFlow } from "@/hooks/use-login-flow";
import { safeNextPath } from "@/lib/public-paths";
import { useTranslations } from "next-intl";

const inputClass =
  "h-11 w-full rounded-[20px] border border-[#e8eaed] bg-white px-3.5 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#e86f22] focus:ring-2 focus:ring-[#fde4d3]";

const labelClass = "text-[13px] font-semibold leading-[19.5px] text-[#374151]";

export function LoginFlowView() {
  const router = useRouter();
  const copy = useTranslations("login");
  const searchParams = useSearchParams();
  const {
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
    isVerifying,
    isVerified,
  } = useLoginFlow();

  // The gate sends a signed-out visitor to /login?next=<where they were going>;
  // ignoring it landed everyone on the dashboard instead.
  const next = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (isVerified) router.push(next ?? "/workspace");
  }, [isVerified, next, router]);

  if (needsEmailVerification) {
    return (
      <VerifyEmailView email={email} onVerified={continueAfterEmailVerified} />
    );
  }

  return (
    <AuthShell>
      <form
        onSubmit={submitLogin}
        className="flex w-full max-w-[384px] flex-col gap-2"
      >
        <h1 className="pt-8 text-center text-2xl font-bold leading-9 text-[#676e78]">
          {copy("title")}
        </h1>

        <div className="flex flex-col gap-4 pt-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className={labelClass}>
              {copy("email")} <span className="text-[#e5701d]">*</span>
            </label>
            <input
              id="login-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy("emailPlaceholder")}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className={labelClass}>
                {copy("password")} <span className="text-[#e5701d]">*</span>
              </label>
              <button
                type="button"
                onClick={sendPasswordReset}
                className="text-xs font-medium text-[#e5701d] hover:underline"
              >
                {copy("forgotPassword")}
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={!isReady || isVerifying}
            className="h-[46px] w-full rounded-[20px] bg-[#e86f22] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
          >
            {isVerifying ? copy("submitting") : copy("submit")}
          </button>
        </div>

        {loginError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {loginError}
          </p>
        ) : null}

        {notice ? (
          <p
            role="status"
            className="mt-3 rounded-lg border border-[#f2d3b8] bg-[#fff9f5] px-3 py-2 text-xs text-[#c85816]"
          >
            {notice}
          </p>
        ) : null}

        <div className="mt-9 flex flex-col gap-3 border-t border-[#f3f4f6] pt-7">
          <p className="text-center text-[13px] font-medium leading-[19.5px] text-[#6b7280]">
            {copy("newHere")}
          </p>
          <Link
            href="/signup"
            className="flex h-[46px] items-center justify-center rounded-[20px] border border-[#e4e7ea] text-sm font-semibold text-[#f97316] transition hover:border-[#e86f22] hover:bg-[#fff9f5]"
          >
            {copy("signUp")}
          </Link>
        </div>

        <div className="flex items-center justify-center pt-2">
          <Link
            href="/invite"
            className="text-xs leading-[18px] text-[#6b7280] underline hover:text-[#111827]"
          >
            {copy("invite")}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
