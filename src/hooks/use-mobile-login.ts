"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useLoginFlow } from "@/hooks/use-login-flow";
import { MOBILE_HOME } from "@/lib/mobile";
import { safeNextPath } from "@/lib/public-paths";

export enum MobileLoginSheet {
  SignupInfo = "signup-info",
  PasswordReset = "password-reset",
}

export function useMobileLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = useLoginFlow();
  const [showPassword, setShowPassword] = useState(false);
  const [sheet, setSheet] = useState<MobileLoginSheet | null>(null);

  const next = safeNextPath(searchParams.get("next"));
  const { isVerified } = flow;

  useEffect(() => {
    if (isVerified) router.replace(next ?? MOBILE_HOME);
  }, [isVerified, next, router]);

  return {
    ...flow,
    next,
    showPassword,
    togglePassword: () => setShowPassword((shown) => !shown),
    sheet,
    openSheet: setSheet,
    closeSheet: () => setSheet(null),
  };
}
