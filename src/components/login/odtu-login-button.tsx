// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { useInstitutionLogin } from "@/hooks/use-institution-login";

export function OdtuLoginButton() {
  const copy = useTranslations("login");
  const { available, starting, error, startOdtuLogin } = useInstitutionLogin();
  if (!available) return null;

  return (
    <div className="flex flex-col gap-2 pt-3">
      <button
        type="button"
        onClick={() => void startOdtuLogin()}
        disabled={starting}
        className="h-[46px] w-full rounded-[20px] border border-[#e4e7ea] text-sm font-semibold text-[#374151] transition hover:border-[#e86f22] hover:bg-[#fff9f5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {copy("odtu")}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
