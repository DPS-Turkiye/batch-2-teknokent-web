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
        className="relative flex min-h-[46px] w-full items-center justify-center rounded-[20px] border border-[#e4e7ea] px-11 py-2 text-center text-sm leading-tight font-semibold text-[#374151] transition hover:border-[#005397] hover:bg-[#f5f9fc]"
      >
        {/* Pinned to the edge so the centred name can wrap onto two lines on phones without leaving it behind. */}
        <Image
          src="/otg-logo.svg"
          alt=""
          width={24}
          height={24}
          unoptimized
          className="absolute top-1/2 left-4 -translate-y-1/2"
        />
        <span className="text-balance">{copy("otg")}</span>
      </a>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
