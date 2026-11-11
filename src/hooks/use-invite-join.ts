"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useRegisterForm } from "@/hooks/use-auth-form";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import {
  createFirebaseAccount,
  currentIdToken,
  currentOtgAccount,
  describeAuthError,
  isCurrentEmailVerified,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { splitFullName } from "@/lib/utils";

/**
 * /invite: join a team with its invite code. Someone who just signed in with OTG already has a Firebase login
 * under their OTG address, so they join with it (the address read-only, no password); creating a second login
 * for the same address would fail with "email already in use". Everyone else gets a new e-mail + password login,
 * as before.
 */
export function useInviteJoin() {
  const fields = useTranslations("auth");
  const router = useRouter();
  const { login } = useSession();
  const register = useRegisterForm();
  const { form, prefill, reset } = register;
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [otgAccount, setOtgAccount] = useState<{
    email: string;
    verified: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void currentOtgAccount()
      .then((account) => {
        if (!active || !account) return;
        setOtgAccount({ email: account.email, verified: account.verified });
        prefill({ email: account.email, ...splitFullName(account.fullName) });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [prefill]);

  const canJoin = Boolean(
    inviteCode.trim() &&
    (otgAccount
      ? form.firstName.trim() &&
        form.lastName.trim() &&
        form.phone.trim() &&
        !register.phoneErrorMessage
      : register.canSubmit),
  );

  async function joinAfterEmailVerified() {
    const idToken = await currentIdToken();
    if (!idToken) {
      throw new Error(fields("sessionExpired"));
    }
    await registerMember(
      {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: otgAccount?.email ?? form.email.trim(),
        inviteCode: inviteCode.trim(),
        phone: form.phone.trim() || undefined,
      },
      idToken,
    );
    await login(idToken);
    router.push("/workspace");
  }

  async function join() {
    if (!canJoin || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (!otgAccount) {
        await createFirebaseAccount(form.email, form.password);
      }
      const verified = otgAccount
        ? otgAccount.verified
        : isCurrentEmailVerified();
      if (!verified) {
        setNeedsEmailVerification(true);
        setSubmitting(false);
        return;
      }
      await joinAfterEmailVerified();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : describeAuthError(caught),
      );
      setSubmitting(false);
    }
  }

  /**
   * Not the OTG person who is signed in: sign them out and fall back to a new e-mail + password login, with the
   * form emptied of what came from their OTG profile. If the sign-out fails, stay on the OTG login: the new login
   * would only fail with "email already in use".
   */
  async function switchAccount() {
    setError("");
    try {
      await signOutOfFirebase();
    } catch (caught) {
      setError(describeAuthError(caught));
      return;
    }
    setOtgAccount(null);
    reset();
  }

  return {
    ...register,
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
  };
}
