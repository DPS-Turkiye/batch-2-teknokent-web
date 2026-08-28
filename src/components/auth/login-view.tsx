"use client";

import Link from "next/link";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { useLoginForm } from "@/hooks/use-auth-form";

const roleRoutes = [
  {
    href: "/auth/register",
    title: "Startup'ımla katıl",
    description: "Girişimini METUal'a ekle ve mentorluk süreçlerine katıl.",
  },
  {
    href: "/auth/register?role=mentor",
    title: "Mentor olmak istiyorum",
    description:
      "Deneyimini girişimlerle paylaşmak için mentor başvurusu oluştur.",
  },
];

export function LoginView() {
  const { form, update, canSubmit } = useLoginForm();

  return (
    <AuthShell>
      <div className="flex flex-col gap-2 py-8">
        <h1 className="pt-4 text-center text-2xl font-bold leading-9 text-[#111827]">
          METUal&apos;a hoş geldin
        </h1>

        <div className="flex flex-col gap-4 pt-8">
          <AuthField
            id="login-email"
            label="E-posta"
            required
            type="email"
            placeholder="ornek@email.com"
            value={form.email}
            onChange={(value) => update("email", value)}
          />
          <AuthField
            id="login-password"
            label="Şifre"
            required
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(value) => update("password", value)}
            action={
              <button
                type="button"
                className="text-xs font-medium text-[#e5701d] hover:underline"
              >
                Şifremi unuttum
              </button>
            }
          />
        </div>

        <div className="pt-6">
          <button
            type="button"
            disabled={!canSubmit}
            className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
          >
            Giriş yap
          </button>
        </div>

        <div className="mt-9 border-t border-[#f3f4f6] pt-7">
          <p className="text-center text-[13px] font-medium text-[#6b7280]">
            METUal&apos;a yeni misin?
          </p>
          <div className="flex flex-col gap-3 pt-5">
            {roleRoutes.map((route) => (
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
      </div>
    </AuthShell>
  );
}
