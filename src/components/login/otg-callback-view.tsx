// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { useOtgCallback } from "@/hooks/use-otg-callback";

export function OtgCallbackView() {
  const copy = useTranslations("otgLogin");
  const { error } = useOtgCallback();

  return (
    <AuthShell>
      <div className="flex w-full max-w-[440px] flex-col items-center gap-3 pt-8 text-center">
        {error ? (
          <>
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <Link
              href="/login"
              className="text-sm font-semibold text-[#e86f22] hover:underline"
            >
              {copy("backToLogin")}
            </Link>
          </>
        ) : (
          <p role="status" className="text-sm text-[#6b7280]">
            {copy("signingIn")}
          </p>
        )}
      </div>
    </AuthShell>
  );
}
