"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { assignLocation } from "@/lib/assign-location";
import { startInstitutionLogin } from "@/lib/client/institution-login";
import { OTG_FAILURE_PARAM, OtgLoginFailure } from "@/lib/otg-login";
import { safeNextPath } from "@/lib/public-paths";

/**
 * Opened with a plain GET, because OTG's own "Menton'a git" button links here: the student is already signed in at
 * OTG, so they come back signed in without typing anything. The browser starts the login itself, so the backend
 * can bind it to this browser. ?next= is kept only when it is an in-app path.
 */
export function OtgStartView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const next = safeNextPath(searchParams.get("next"));
    const backToLogin = () => {
      const login = new URLSearchParams({
        [OTG_FAILURE_PARAM]: OtgLoginFailure.Failed,
      });
      if (next) login.set("next", next);
      router.replace(`/login?${login}`);
    };
    void startInstitutionLogin(InstitutionProvider.Otg, next)
      .then(({ redirectUrl }) =>
        redirectUrl.startsWith("https://")
          ? assignLocation(redirectUrl)
          : backToLogin(),
      )
      .catch(backToLogin);
  }, [router, searchParams]);

  return null;
}
