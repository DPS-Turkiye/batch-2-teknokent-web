"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useRegisterForm } from "@/hooks/use-auth-form";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import { checkInviteCode } from "@/lib/client/invite-code";
import {
  createFirebaseAccount,
  currentIdToken,
  currentSignedInAccount,
  describeAuthError,
  isCurrentEmailVerified,
  isEmailAlreadyInUse,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import {
  clearInviteIntent,
  inviteCodeOrNull,
  readInviteIntent,
  saveInviteIntent,
} from "@/lib/invite-intent";
import { splitFullName } from "@/lib/utils";

type SignedInAccount = { email: string; verified: boolean; otg: boolean };

const CodeCheckStatus = {
  Unknown: "unknown",
  Valid: "valid",
  Invalid: "invalid",
} as const;

/** What the code check said: unknown until asked, or when the check itself could not answer. */
type CodeCheck =
  | { status: typeof CodeCheckStatus.Unknown }
  | { status: typeof CodeCheckStatus.Valid; teamName: string | null }
  | { status: typeof CodeCheckStatus.Invalid };

const UNCHECKED: CodeCheck = { status: CodeCheckStatus.Unknown };

/** A check answers for the code it was asked about; once the field holds another code, it says nothing. */
type CheckedCode = { code: string; check: CodeCheck };

/**
 * The check only spares a dead end; registration checks the code again. So a check that fails (rate limit,
 * network) lets the join go ahead instead of blocking it.
 */
async function checkCode(code: string): Promise<CodeCheck> {
  try {
    const answer = await checkInviteCode(code);
    return answer.valid
      ? { status: CodeCheckStatus.Valid, teamName: answer.teamName }
      : { status: CodeCheckStatus.Invalid };
  } catch {
    return UNCHECKED;
  }
}

/**
 * /invite: join a team with its invite code. The code is checked before any login is made, so a typo leaves
 * nothing behind. Someone already signed in to Firebase in this tab (an OTG login, or the e-mail + password login
 * they made here before leaving to verify it) joins with that login: making a second one for the same address
 * fails with "email already in use". A new login that hits "email already in use" is sent to sign in, and the
 * code saved in this browser brings them back here afterwards.
 */
export function useInviteJoin() {
  const fields = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const register = useRegisterForm();
  const { form, prefill, reset } = register;
  const linkCode = inviteCodeOrNull(searchParams.get("code"));
  const resumed = searchParams.get("resume") === "1";
  const [inviteCode, setInviteCode] = useState(
    () => linkCode ?? readInviteIntent()?.code ?? "",
  );
  const [checked, setChecked] = useState<CheckedCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailInUse, setEmailInUse] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [account, setAccount] = useState<SignedInAccount | null>(null);

  useEffect(() => {
    let active = true;
    void currentSignedInAccount()
      .then((signedIn) => {
        if (!active || !signedIn) return;
        setAccount({
          email: signedIn.email,
          verified: signedIn.verified,
          otg: signedIn.otg,
        });
        prefill({ email: signedIn.email, ...splitFullName(signedIn.fullName) });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [prefill]);

  // A shared link names the team up front, so the person sees they are joining the right one.
  useEffect(() => {
    if (!linkCode) return;
    let active = true;
    void checkCode(linkCode).then((check) => {
      if (active) setChecked({ code: linkCode, check });
    });
    return () => {
      active = false;
    };
  }, [linkCode]);

  const codeCheck =
    checked?.code === inviteCode.trim() ? checked.check : UNCHECKED;

  const canJoin = Boolean(
    inviteCode.trim() &&
    (account
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
        email: account?.email ?? form.email.trim(),
        inviteCode: inviteCode.trim(),
        phone: form.phone.trim() || undefined,
      },
      idToken,
    );
    clearInviteIntent();
    await login(idToken);
    router.push("/workspace");
  }

  async function join() {
    if (!canJoin || submitting) return;
    setSubmitting(true);
    setError("");
    setEmailInUse(false);
    const code = inviteCode.trim();
    // Kept when the login exists (or already did): the person comes back here at their next sign-in.
    let loginExists = Boolean(account);
    try {
      const check = await checkCode(code);
      setChecked({ code, check });
      if (check.status === CodeCheckStatus.Invalid) {
        setSubmitting(false);
        return;
      }
      saveInviteIntent(code);
      if (!account) {
        await createFirebaseAccount(form.email, form.password);
        loginExists = true;
      }
      const verified = account ? account.verified : isCurrentEmailVerified();
      if (!verified) {
        setNeedsEmailVerification(true);
        setSubmitting(false);
        return;
      }
      await joinAfterEmailVerified();
    } catch (caught) {
      if (isEmailAlreadyInUse(caught)) {
        setEmailInUse(true);
      } else {
        if (!loginExists) clearInviteIntent();
        setError(
          caught instanceof ClientApiError
            ? caught.message
            : describeAuthError(caught),
        );
      }
      setSubmitting(false);
    }
  }

  /**
   * Not the person who is signed in: sign them out and fall back to a new e-mail + password login, with the form
   * emptied of what came from the signed-in profile. If the sign-out fails, stay on the signed-in login: the new
   * login would only fail with "email already in use".
   */
  async function switchAccount() {
    setError("");
    try {
      await signOutOfFirebase();
    } catch (caught) {
      setError(describeAuthError(caught));
      return;
    }
    setAccount(null);
    clearInviteIntent();
    reset();
  }

  return {
    ...register,
    inviteCode,
    setInviteCode,
    teamName:
      codeCheck.status === CodeCheckStatus.Valid ? codeCheck.teamName : null,
    codeInvalid: codeCheck.status === CodeCheckStatus.Invalid,
    resumed,
    account,
    verificationEmail: account?.email ?? form.email.trim(),
    canJoin,
    submitting,
    error,
    emailInUse,
    needsEmailVerification,
    join,
    joinAfterEmailVerified,
    switchAccount,
  };
}
