"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { authFieldClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { useLoginFlow } from "@/hooks/use-login-flow";

const joinRoutes = [
  {
    href: "/signup",
    title: "Startup'ımla katıl",
    description: "Girişimini METUal'a ekle ve mentorluk süreçlerine katıl.",
  },
  {
    href: "/signup?role=mentor",
    title: "Mentor olmak istiyorum",
    description:
      "Deneyimini girişimlerle paylaşmak için mentor başvurusu oluştur.",
  },
];

export function LoginFlowView() {
  const router = useRouter();
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

  useEffect(() => {
    if (isVerified) router.push("/workspace");
  }, [isVerified, router]);

  if (needsEmailVerification) {
    return (
      <VerifyEmailView email={email} onVerified={continueAfterEmailVerified} />
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submitLogin} className="flex flex-col gap-2 py-8">
        <h1 className="pt-4 text-center text-2xl font-bold leading-9 text-[#111827]">
          METUal&apos;a hoş geldin
        </h1>

        <div className="flex flex-col gap-4 pt-8">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-[13px] font-semibold leading-[19.5px] text-[#374151]"
            >
              E-posta <span className="text-[#e5701d]">*</span>
            </label>
            <input
              id="login-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@email.com"
              className={authFieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-[13px] font-semibold leading-[19.5px] text-[#374151]"
              >
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
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={authFieldClass}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-[#6b7280]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 accent-[#e5701d]"
            />
            Beni Hatırla
          </label>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={!isReady || isVerifying}
            className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
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

        <div className="mt-9 border-t border-[#f3f4f6] pt-7">
          <p className="text-center text-[13px] font-medium text-[#6b7280]">
            METUal&apos;a yeni misin?
          </p>
          <div className="flex flex-col gap-3 pt-5">
            {joinRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-xl border-[1.37px] border-[#e8eaed] p-4 transition hover:border-[#e5701d] hover:bg-[#fff9f5]"
              >
                <span className="block text-sm font-semibold text-[#111827]">
                  {route.title}
                </span>
                <span className="block pt-1 text-xs leading-[18px] text-[#6b7280]">
                  {route.description}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center pt-4">
          <Link
            href="/invite"
            className="text-xs text-[#6b7280] underline hover:text-[#111827]"
          >
            Bir davet aldın mı? Davet kodunla devam et
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
