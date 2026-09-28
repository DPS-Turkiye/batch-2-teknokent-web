"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { MentonLogo } from "@/components/onboarding/onboarding-layout";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { useLoginFlow } from "@/hooks/use-login-flow";
import { safeNextPath } from "@/lib/public-paths";

const inputClass =
  "h-11 w-full rounded-[20px] border border-[#e8eaed] bg-white px-3.5 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#e86f22] focus:ring-2 focus:ring-[#fde4d3]";

const labelClass = "text-[13px] font-semibold leading-[19.5px] text-[#374151]";

export function LoginFlowView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
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
    <div className="flex min-h-screen bg-white text-[#111827]">
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <MentonLogo tone={OnboardingTone.Mentee} />
        <div className="flex flex-1 items-center justify-center py-8">
          <form
            onSubmit={submitLogin}
            noValidate
            className="flex w-full max-w-[384px] flex-col gap-2"
          >
            <h1 className="pt-8 text-center text-2xl font-bold leading-9 text-[#676e78]">
              Menton’a hoş geldin
            </h1>

            <div className="flex flex-col gap-4 pt-8">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className={labelClass}>
                  E-posta <span className="text-[#e5701d]">*</span>
                </label>
                <input
                  id="login-email"
                  name="username"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@email.com"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className={labelClass}>
                    Şifre <span className="text-[#e5701d]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={sendPasswordReset}
                    className="text-xs font-medium text-[#e5701d] hover:underline"
                  >
                    Şifremi unuttum
                  </button>
                </div>
                <input
                  id="login-password"
                  name="password"
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

            <label className="flex items-center gap-2 pt-1 text-xs text-[#6b7280]">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="size-4 accent-[#e86f22]"
              />
              Beni Hatırla
            </label>

            <div className="pt-6">
              <button
                type="submit"
                disabled={!isReady || isVerifying}
                className="h-[46px] w-full rounded-[20px] bg-[#e86f22] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
              >
                {isVerifying ? "Giriş yapılıyor…" : "Giriş yap"}
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
                Menton’a yeni misin?
              </p>
              <Link
                href="/signup"
                className="flex h-[46px] items-center justify-center rounded-[20px] border border-[#e4e7ea] text-sm font-semibold text-[#f97316] transition hover:border-[#e86f22] hover:bg-[#fff9f5]"
              >
                Kayıt Ol
              </Link>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link
                href="/invite"
                className="text-xs leading-[18px] text-[#6b7280] underline hover:text-[#111827]"
              >
                Bir davet aldın mı? Davet kodunla devam et
              </Link>
            </div>
          </form>
        </div>
      </main>
      <div className="relative hidden w-[46%] max-w-[657px] shrink-0 overflow-hidden lg:block">
        <Image
          src="/onboarding/login-panel.svg"
          alt=""
          fill
          priority
          sizes="657px"
          className="object-cover object-left"
        />
      </div>
    </div>
  );
}
