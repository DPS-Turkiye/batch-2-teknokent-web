// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { useOtgLogin } from "@/hooks/use-otg-login";

export function OtgLoginButton({ next }: { next: string | null }) {
  const copy = useTranslations("login");
  const { available, href, error } = useOtgLogin(next);
  if (!available) return null;

  return (
    <div className="flex flex-col gap-2 pt-3">
      {/* A full page load: the start path is a server redirect to OTG, not an app page. */}
      <a
        href={href}
        className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[20px] border border-[#e4e7ea] text-sm font-semibold text-[#374151] transition hover:border-[#005397] hover:bg-[#f5f9fc]"
      >
        <Image src="/otg-logo.svg" alt="" width={24} height={24} unoptimized />
        {copy("otg")}
      </a>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
