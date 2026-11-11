"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import {
  isOtgLoginEnabled,
  OtgLoginFailure,
  otgStartHref,
} from "@/lib/otg-login";

/**
 * The "OTG ile giriş yap" button. It is a plain link, because the start path is a server redirect that OTG's
 * own button opens too; ?otg= says an earlier attempt could not start.
 */
export function useOtgLogin(next: string | null) {
  const copy = useTranslations("otgLogin");
  const failure = useSearchParams().get("otg");

  return {
    available: isOtgLoginEnabled(),
    href: otgStartHref(next),
    error: failure === OtgLoginFailure.Failed ? copy("failed") : "",
  };
}
