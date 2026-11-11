"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { InstitutionProvider } from "@/interfaces/institution-login";
import { accountNotReadyHref } from "@/lib/account-not-ready";
import { completeInstitutionLogin } from "@/lib/client/institution-login";
import {
  describeAuthError,
  signInWithInstitutionToken,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { safeNextPath } from "@/lib/public-paths";

const ACCESS_DENIED = "access_denied";

/**
 * Where OTG sends the browser back. The code is traded on the server (which also checks this browser started
 * the login); the browser signs in to Firebase with the custom token, then opens the session. Someone OTG knows
 * but Menton doesn't yet lands in the ordinary signup, already signed in, so onboarding, invite codes and
 * coordinator approval run as for everyone else.
 */
export function useOtgCallback() {
  const router = useRouter();
  const { login } = useSession();
  const copy = useTranslations("otgLogin");
  const params = useSearchParams();
  const [error, setError] = useState("");
  // The state and code are single use; a second run (StrictMode, a re-render) would only fail.
  const started = useRef(false);

  const code = params.get("code");
  const state = params.get("state");
  const otgError = params.get("error");
  // What OTG's redirect alone says went wrong ("Vazgeç" on its consent screen is access_denied).
  const callbackError = otgError
    ? copy(otgError === ACCESS_DENIED ? "cancelled" : "failed")
    : !code || !state
      ? copy("failed")
      : "";

  useEffect(() => {
    if (started.current || callbackError || !code || !state) return;
    started.current = true;
    void (async () => {
      let idToken: string | null = null;
      // From here the old Menton session is gone, so no earlier Firebase login may linger either.
      let exchanged = false;
      try {
        const { customToken, next } = await completeInstitutionLogin(
          InstitutionProvider.Otg,
          state,
          { code },
        );
        exchanged = true;
        idToken = await signInWithInstitutionToken(customToken);
        await login(idToken);
        router.replace(safeNextPath(next ?? null) ?? "/workspace");
      } catch (caught) {
        const href = await accountNotReadyHref(caught, idToken);
        if (href) {
          router.replace(href);
          return;
        }
        // Otherwise a refused login would stay signed in to Firebase, and /signup would pick it up.
        if (exchanged) await signOutOfFirebase().catch(() => undefined);
        setError(describeAuthError(caught));
      }
    })();
  }, [callbackError, code, login, router, state]);

  return { error: callbackError || error };
}
