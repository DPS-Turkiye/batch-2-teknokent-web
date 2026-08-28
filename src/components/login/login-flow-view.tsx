"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authFieldClass } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { useLoginFlow } from "@/hooks/use-login-flow";
import { LoginFlowStep } from "@/interfaces/login";
import { UserRole } from "@/interfaces/session";

/**
 * Temporary developer affordance: the Figma frame has no demo picker, but
 * there are no real credentials yet, so this is the only way to sign in.
 * Never rendered in a production build; remove it once real auth lands.
 */
const SHOW_DEMO_PICKER = process.env.NODE_ENV !== "production";

type DemoFilter = "all" | "mentee" | "mentor";

const DEMO_FILTERS: { id: DemoFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "mentee", label: "Mentee" },
  { id: "mentor", label: "Mentor" },
];

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

/**
 * The shared login screen (Figma mentor/1, 274:6429 — the same frame as
 * sunum/ana log in 208:1984 plus "Beni Hatırla").
 *
 * Submitting runs the existing demo session login, so signing in still works
 * exactly as before; only the screen around it changed. The password field is
 * presentational until the auth backend lands.
 */
export function LoginFlowView() {
  const router = useRouter();
  const { email, setEmail, loginError, submitLogin, step } = useLoginFlow();
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Demo accounts are the only way in until real credentials exist.
  const menteeAccounts = useDemoAccounts(UserRole.Mentee);
  const mentorAccounts = useDemoAccounts(UserRole.Mentor);
  const [demoFilter, setDemoFilter] = useState<DemoFilter>("all");

  const accounts = [
    ...(menteeAccounts.data ?? []).map((account) => ({
      account,
      role: UserRole.Mentee,
    })),
    ...(mentorAccounts.data ?? []).map((account) => ({
      account,
      role: UserRole.Mentor,
    })),
  ].filter(
    (entry) =>
      demoFilter === "all" ||
      (demoFilter === "mentor"
        ? entry.role === UserRole.Mentor
        : entry.role === UserRole.Mentee),
  );

  const isVerifying = step === LoginFlowStep.Verifying;

  useEffect(() => {
    if (step === LoginFlowStep.Verified) router.push("/workspace");
  }, [step, router]);

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
              type="email"
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
                className="text-xs font-medium text-[#e5701d] hover:underline"
              >
                Şifremi unuttum
              </button>
            </div>
            <input
              id="login-password"
              type="password"
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
            disabled={isVerifying}
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

        {SHOW_DEMO_PICKER ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8eaed] bg-[#fcfcfd] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Demo hesapları
                <span className="ml-1.5 font-normal normal-case tracking-normal text-[#c9cdd2]">
                  · yalnızca geliştirme
                </span>
              </p>
              <div
                role="group"
                aria-label="Demo hesap filtresi"
                className="flex items-center gap-1 rounded-lg bg-[#f1f2f4] p-0.5"
              >
                {DEMO_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={demoFilter === filter.id}
                    onClick={() => setDemoFilter(filter.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                      demoFilter === filter.id
                        ? "bg-white text-[#22262b] shadow-sm"
                        : "text-[#858c96] hover:text-[#22262b]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {accounts.map(({ account, role }) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setEmail(account.email)}
                  className="flex items-center gap-2 rounded-lg border border-[#e8eaed] bg-white px-2.5 py-1.5 text-left text-[11px] text-[#374151] transition hover:border-[#e5701d] hover:text-[#c85816]"
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      role === UserRole.Mentor
                        ? "bg-[#eaf1fb] text-[#2f6fd0]"
                        : "bg-[#fdebdd] text-[#c85816]"
                    }`}
                  >
                    {role === UserRole.Mentor ? "Mentor" : "Mentee"}
                  </span>
                  {account.fullName} · {account.email}
                </button>
              ))}
              {accounts.length === 0 ? (
                <p className="text-[11px] text-[#858c96]">
                  Bu filtrede demo hesabı yok.
                </p>
              ) : null}
            </div>
          </div>
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
          <button
            type="button"
            className="text-xs text-[#6b7280] underline hover:text-[#111827]"
          >
            Bir davet aldın mı? Davet kodunla devam et
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
