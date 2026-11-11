"use client";

import { useState } from "react";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { assignLocation } from "@/lib/assign-location";
import { startInstitutionLogin } from "@/lib/client/institution-login";
import { isOdtuDevLoginEnabled } from "@/lib/const";
import { describeAuthError } from "@/lib/firebase/auth";

/** The "ODTÜ Hesabıyla Giriş Yap" button: offered only while the dev persona login stands in for ODTÜ's. */
export function useInstitutionLogin() {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function startOdtuLogin() {
    setError("");
    setStarting(true);
    try {
      const { redirectUrl } = await startInstitutionLogin(
        InstitutionProvider.Odtu,
      );
      assignLocation(redirectUrl);
    } catch (caught) {
      setError(describeAuthError(caught));
      setStarting(false);
    }
  }

  return {
    available: isOdtuDevLoginEnabled(),
    starting,
    error,
    startOdtuLogin,
  };
}
