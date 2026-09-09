"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { useRegisterForm } from "@/hooks/use-auth-form";
import { type RegisterForm } from "@/interfaces/auth";
import { ClientApiError } from "@/lib/client/api";
import { describeAuthError } from "@/lib/firebase/auth";
import { PASSWORD_HINT } from "@/lib/password";

const menteeSteps = [
  "Hesabını oluştur",
  "E-postanı doğrula",
  "Startup profilini tamamla",
  "Koordinatör onayını bekle",
];

const mentorSteps = [
  "Hesabını oluştur",
  "E-postanı doğrula",
  "CV'nden mentor profilini oluştur",
  "Onaydan sonra eşleşmelere başla",
];

export function RegisterView({
  onSubmit,
  isMentor = false,
}: {
  onSubmit: (form: RegisterForm) => Promise<void>;
  isMentor?: boolean;
}) {
  const {
    form,
    update,
    updatePhone,
    canSubmit,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
    phoneErrorMessage,
  } = useRegisterForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const steps = isMentor ? mentorSteps : menteeSteps;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : describeAuthError(caught),
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-2 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          {isMentor
            ? "Mentor olarak METUal'a katıl"
            : "Startup'ınla METUal'a katıl"}
        </h1>

        <div className="flex flex-col gap-4 pt-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="register-first-name"
              label="Ad"
              required
              placeholder="Adınız"
              value={form.firstName}
              onChange={(value) => update("firstName", value)}
            />
            <AuthField
              id="register-last-name"
              label="Soyad"
              required
              placeholder="Soyadınız"
              value={form.lastName}
              onChange={(value) => update("lastName", value)}
            />
          </div>
          <div>
            <AuthField
              id="register-email"
              label="E-posta"
              required
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={(value) => update("email", value)}
            />
            {emailCharacterErrorMessage ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                {emailCharacterErrorMessage}
              </p>
            ) : null}
          </div>
          <AuthField
            id="register-phone"
            label="Telefon"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="+90"
            value={form.phone}
            onChange={updatePhone}
            error={phoneErrorMessage}
          />
          <div>
            <AuthField
              id="register-password"
              label="Şifre"
              required
              type="password"
              placeholder={PASSWORD_HINT}
              value={form.password}
              onChange={(value) => update("password", value)}
            />
            {passwordStrengthErrorMessage ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                {passwordStrengthErrorMessage}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-[#6b7280]">{PASSWORD_HINT}</p>
            )}
          </div>
          <div>
            <AuthField
              id="register-password-confirm"
              label="Şifre tekrar"
              required
              type="password"
              placeholder="Şifrenizi tekrarlayın"
              value={form.passwordConfirm}
              onChange={(value) => update("passwordConfirm", value)}
            />
            {passwordsMismatch ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                Şifreler eşleşmiyor.
              </p>
            ) : null}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
          >
            {submitting ? "Hesap oluşturuluyor…" : "Hesap oluştur ve devam et"}
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-[#e8eaed] p-4">
          <h2 className="text-[13px] font-semibold text-[#111827]">
            Nasıl çalışır?
          </h2>
          <ol className="mt-3 flex flex-col gap-2.5">
            {steps.map((label, index) => (
              <li key={label} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-[#fdebdd] text-[10px] font-bold text-[#c85816]"
                >
                  {index + 1}
                </span>
                <span className="text-xs text-[#6b7280]">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="pt-5 text-center text-xs text-[#6b7280]">
          Zaten hesabın var mı?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#e5701d] hover:underline"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
