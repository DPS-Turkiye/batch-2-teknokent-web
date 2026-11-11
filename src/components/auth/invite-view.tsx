"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { useInviteJoin } from "@/hooks/use-invite-join";
import { PASSWORD_HINT } from "@/lib/password";

export function InviteView() {
  const copy = useTranslations("invite");
  const fields = useTranslations("auth");
  const {
    form,
    update,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
    inviteCode,
    setInviteCode,
    otgAccount,
    canJoin,
    submitting,
    error,
    needsEmailVerification,
    join,
    joinAfterEmailVerified,
    switchAccount,
  } = useInviteJoin();

  if (needsEmailVerification) {
    return (
      <VerifyEmailView
        email={form.email.trim()}
        onVerified={joinAfterEmailVerified}
      />
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-2 py-8">
        <h1 className="text-center text-2xl font-bold leading-9 text-[#111827]">
          {copy("title")}
        </h1>
        <p className="pt-2 text-center text-xs leading-[18px] text-[#6b7280]">
          {copy("intro")}
        </p>

        {otgAccount ? (
          // TEST UI: placeholder until the design team's screen; replace when it arrives.
          <div className="mt-5 flex flex-col gap-1 rounded-lg border border-[#d6e4f0] bg-[#f5f9fc] px-3 py-2 text-xs text-[#374151]">
            <p>
              {copy("otgAccount")}{" "}
              <span className="font-semibold break-all">
                {otgAccount.email}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void switchAccount()}
              className="self-start font-semibold text-[#e5701d] hover:underline"
            >
              {copy("otgSwitch")}
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 pt-7">
          <AuthField
            id="invite-code"
            label={copy("code")}
            required
            placeholder="ABCD1234"
            value={inviteCode}
            onChange={setInviteCode}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="invite-first-name"
              label={fields("firstName")}
              required
              placeholder={fields("firstNamePlaceholder")}
              value={form.firstName}
              onChange={(value) => update("firstName", value)}
            />
            <AuthField
              id="invite-last-name"
              label={fields("lastName")}
              required
              placeholder={fields("lastNamePlaceholder")}
              value={form.lastName}
              onChange={(value) => update("lastName", value)}
            />
          </div>
          {otgAccount ? null : (
            <div>
              <AuthField
                id="invite-email"
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
          )}
          <AuthField
            id="invite-phone"
            label={fields("phone")}
            required
            type="tel"
            placeholder="+90"
            value={form.phone}
            onChange={(value) => update("phone", value)}
          />
          {otgAccount ? null : (
            <>
              <div>
                <AuthField
                  id="invite-password"
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
                  <p className="mt-1.5 text-xs text-[#6b7280]">
                    {PASSWORD_HINT}
                  </p>
                )}
              </div>
              <div>
                <AuthField
                  id="invite-password-confirm"
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
            </>
          )}
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => void join()}
            disabled={!canJoin || submitting}
            className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
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

        <p className="pt-5 text-center text-xs text-[#6b7280]">
          {copy("noCode")}{" "}
          <Link
            href="/login"
            className="font-semibold text-[#e5701d] hover:underline"
          >
            {copy("backToLogin")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
