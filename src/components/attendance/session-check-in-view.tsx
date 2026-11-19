// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { useSessionCheckIn } from "@/hooks/use-session-check-in";
import { CheckInPhase } from "@/types/attendance";

/** What a participant sees after scanning a session's QR code. */
export function SessionCheckInView({ token }: { token: string }) {
  const t = useTranslations("attendCheckIn");
  const { phase, session, message, canRetry, retry } = useSessionCheckIn(token);

  return (
    <AuthShell>
      <h1 className="sr-only">{t("title")}</h1>
      <section
        aria-live="polite"
        className="space-y-4 py-10 text-center text-[#22262b]"
      >
        {phase === CheckInPhase.Checking ? (
          <p className="flex items-center justify-center gap-2 text-[14px] text-[#676e78]">
            <LoaderCircle aria-hidden className="size-5 animate-spin" />
            {t("checking")}
          </p>
        ) : phase === CheckInPhase.Failed ? (
          <>
            <CircleAlert
              aria-hidden
              className="mx-auto size-10 text-[#d9464b]"
            />
            <p className="text-[17px] font-semibold">{t("notRecorded")}</p>
            {message ? (
              <p className="text-[14px] text-[#676e78]">{message}</p>
            ) : null}
            {canRetry ? (
              <button
                type="button"
                onClick={retry}
                className="h-10 rounded-full bg-[#22262b] px-5 text-[13.5px] font-medium text-white"
              >
                {t("retry")}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <CircleCheck
              aria-hidden
              className="mx-auto size-10 text-[#1f7a4d]"
            />
            <p className="text-[17px] font-semibold">
              {phase === CheckInPhase.AlreadyRecorded
                ? t("alreadyRecorded")
                : t("recorded")}
            </p>
            {session ? (
              <div className="space-y-0.5 text-[14px] text-[#676e78]">
                <p className="font-medium text-[#22262b]">
                  {session.programName}
                </p>
                <p>{session.label}</p>
                <p>{session.when}</p>
                {session.title ? <p>{session.title}</p> : null}
              </div>
            ) : null}
          </>
        )}
        <Link
          href="/workspace"
          className="inline-block text-[13px] font-medium text-[#26a4ff]"
        >
          {t("home")}
        </Link>
      </section>
    </AuthShell>
  );
}
