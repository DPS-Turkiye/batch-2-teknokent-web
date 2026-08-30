"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { useSession } from "@/components/providers/session-provider";
import { useRegisterForm } from "@/hooks/use-auth-form";
import { PASSWORD_MIN_LENGTH } from "@/interfaces/auth";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import { createFirebaseAccount, describeAuthError } from "@/lib/firebase/auth";

export function InviteView() {
  const router = useRouter();
  const { login } = useSession();
  const { form, update, canSubmit, passwordTooShort, passwordsMismatch } =
    useRegisterForm();
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const idToken = await createFirebaseAccount(form.email, form.password);
      await registerMember(
        {
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          inviteCode: inviteCode.trim(),
          phone: form.phone.trim() || undefined,
        },
        idToken,
      );
      await login(idToken);
      router.push("/workspace");
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
          Davet kodunla ekibe katıl
        </h1>
        <p className="pt-2 text-center text-xs leading-[18px] text-[#6b7280]">
          Kodu startup&apos;ının kurucusundan alırsın. Kodla oluşturulan
          hesaplar ayrıca onay beklemez.
        </p>

        <div className="flex flex-col gap-4 pt-7">
          <AuthField
            id="invite-code"
            label="Davet kodu"
            required
            placeholder="ABCD1234"
            value={inviteCode}
            onChange={setInviteCode}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="invite-first-name"
              label="Ad"
              required
              placeholder="Adınız"
              value={form.firstName}
              onChange={(value) => update("firstName", value)}
            />
            <AuthField
              id="invite-last-name"
              label="Soyad"
              required
              placeholder="Soyadınız"
              value={form.lastName}
              onChange={(value) => update("lastName", value)}
            />
          </div>
          <AuthField
            id="invite-email"
            label="E-posta"
            required
            type="email"
            placeholder="ornek@email.com"
            value={form.email}
            onChange={(value) => update("email", value)}
          />
          <AuthField
            id="invite-phone"
            label="Telefon"
            required
            type="tel"
            placeholder="+90"
            value={form.phone}
            onChange={(value) => update("phone", value)}
          />
          <div>
            <AuthField
              id="invite-password"
              label="Şifre"
              required
              type="password"
              placeholder={`En az ${PASSWORD_MIN_LENGTH} karakter`}
              value={form.password}
              onChange={(value) => update("password", value)}
            />
            {passwordTooShort ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                Password must be at least {PASSWORD_MIN_LENGTH} characters.
              </p>
            ) : null}
          </div>
          <div>
            <AuthField
              id="invite-password-confirm"
              label="Şifre tekrar"
              required
              type="password"
              placeholder="Şifrenizi tekrarlayın"
              value={form.passwordConfirm}
              onChange={(value) => update("passwordConfirm", value)}
            />
            {passwordsMismatch ? (
              <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
                Passwords do not match.
              </p>
            ) : null}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || !inviteCode.trim() || submitting}
            className="h-[46px] w-full rounded-[10px] bg-[#e5701d] text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]"
          >
            {submitting ? "Hesap oluşturuluyor…" : "Ekibe katıl"}
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
          Davet kodun yok mu?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#e5701d] hover:underline"
          >
            Giriş ekranına dön
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
