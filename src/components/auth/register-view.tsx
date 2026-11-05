"use client";

import Link from "next/link";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { useRegisterForm } from "@/hooks/use-auth-form";
import { type RegisterForm } from "@/interfaces/auth";
import { PASSWORD_HINT } from "@/lib/password";
import { useTranslations } from "next-intl";

export function RegisterView({
  onSubmit,
  isMentor = false,
}: {
  onSubmit: (form: RegisterForm) => Promise<void>;
  isMentor?: boolean;
}) {
  const copy = useTranslations("register");
  const fields = useTranslations("auth");
  const {
    form,
    update,
    updatePhone,
    canSubmit,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
    phoneErrorMessage,
    submitting,
    error,
    submit,
  } = useRegisterForm(onSubmit);
  const steps = copy.raw(isMentor ? "mentorSteps" : "menteeSteps") as string[];

  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-2 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#676e78]">
          {isMentor ? copy("titleMentor") : copy("titleStartup")}
        </h1>

        <div className="flex flex-col gap-4 pt-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="register-first-name"
              label={fields("firstName")}
              required
              placeholder={fields("firstNamePlaceholder")}
              value={form.firstName}
              onChange={(value) => update("firstName", value)}
            />
            <AuthField
              id="register-last-name"
              label={fields("lastName")}
              required
              placeholder={fields("lastNamePlaceholder")}
              value={form.lastName}
              onChange={(value) => update("lastName", value)}
            />
          </div>
          <div>
            <AuthField
              id="register-email"
              label={fields("email")}
              required
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder={fields("emailPlaceholder")}
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
            label={fields("phone")}
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
              label={fields("password")}
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
              label={fields("passwordConfirm")}
              required
              type="password"
              placeholder={fields("passwordConfirmPlaceholder")}
              value={form.passwordConfirm}
              onChange={(value) => update("passwordConfirm", value)}
            />
            {passwordsMismatch ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                {fields("passwordsMismatch")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-[46px] w-full rounded-[20px] bg-[#e86f22] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
          >
            {submitting ? fields("creatingAccount") : copy("submit")}
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
            {copy("howItWorks")}
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
          {copy("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-[#e5701d] hover:underline"
          >
            {fields("signIn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
