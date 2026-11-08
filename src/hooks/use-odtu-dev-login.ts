"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { InstitutionProvider } from "@/interfaces/institution-login";
import {
  completeInstitutionLogin,
  fetchDevPersonas,
  startInstitutionLogin,
} from "@/lib/client/institution-login";
import {
  describeAuthError,
  signInWithInstitutionToken,
} from "@/lib/firebase/auth";

export const DEV_PERSONAS_QUERY_KEY = ["institution-login", "dev-personas"];

/**
 * The dev stand-in for ODTÜ's login page: pick a persona, and the real path runs from there (backend account and
 * grants, Firebase custom token, session cookie). Opened without the backend's state, it starts a fresh login.
 */
export function useOdtuDevLogin(state: string | null) {
  const router = useRouter();
  const { login } = useSession();
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const [error, setError] = useState("");
  const personas = useQuery({
    queryKey: DEV_PERSONAS_QUERY_KEY,
    queryFn: fetchDevPersonas,
  });

  useEffect(() => {
    if (state) return;
    startInstitutionLogin(InstitutionProvider.Odtu)
      .then(({ redirectUrl }) => router.replace(redirectUrl))
      .catch((caught) => setError(describeAuthError(caught)));
  }, [router, state]);

  async function signInAs(personaId: string) {
    if (!state) return;
    setError("");
    setSigningInAs(personaId);
    try {
      const { customToken } = await completeInstitutionLogin(
        InstitutionProvider.Odtu,
        state,
        { persona: personaId },
      );
      await login(await signInWithInstitutionToken(customToken));
      router.push("/workspace");
    } catch (caught) {
      setError(describeAuthError(caught));
      setSigningInAs(null);
    }
  }

  return {
    personas: personas.data ?? [],
    isLoading: personas.isLoading,
    loadError: personas.error ? describeAuthError(personas.error) : "",
    ready: Boolean(state),
    signingInAs,
    error,
    signInAs,
  };
}
