"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  isOtgLoginEnabled,
  OTG_FAILURE_PARAM,
  OtgLoginFailure,
  otgLoginFailure,
  otgStartHref,
} from "@/lib/otg-login";

/**
 * The "OTG ile giriş yap" button. It is a plain link, because the start path is a server redirect that OTG's
 * own button opens too; ?otg= says an earlier attempt could not start.
 */
export function useOtgLogin(next: string | null) {
  const copy = useTranslations("otgLogin");
  const failure = otgLoginFailure(useSearchParams().get(OTG_FAILURE_PARAM));

  return {
    available: isOtgLoginEnabled(),
    href: otgStartHref(next),
    error: failure === OtgLoginFailure.Failed ? copy("failed") : "",
  };
}
