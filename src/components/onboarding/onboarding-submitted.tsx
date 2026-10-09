"use client";

import Image from "next/image";
import Link from "next/link";

import { OnboardingTopbar } from "@/components/onboarding/onboarding-layout";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { formatDateTime, initials } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

interface TimelineRow {
  label: string;
  detail: string;
  icon?: string;
  current?: boolean;
}

export function OnboardingSubmittedView({
  tone,
  name,
  title,
  submittedAt,
  lastStepLabel,
  nextSteps,
  onSignOut,
  signingOut = false,
}: {
  tone: OnboardingTone;
  name: string;
  title: string;
  submittedAt: Date;
  lastStepLabel: string;
  nextSteps: string[];
  onSignOut: () => void;
  signingOut?: boolean;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  const theme = ONBOARDING_TONES[tone];
  const stamp = formatDateTime(submittedAt.toISOString());
  const timeline: TimelineRow[] = [
    { label: copy.completed, detail: stamp, icon: theme.timelineDone[0] },
    {
      label: copy.sent,
      detail: stamp,
      icon: theme.timelineDone[1],
    },
    {
      label: copy.reviewing,
      detail: copy.youAreHere,
      icon: theme.timelineCurrent,
      current: true,
    },
    { label: lastStepLabel, detail: "Onaydan sonra" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#22262b]">
      <OnboardingTopbar
        exitLabel={copy.signOut}
        onExit={onSignOut}
        exiting={signingOut}
      />
      <main className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-[22px] px-4 pb-[72px] pt-14">
        <div
          aria-hidden
          className={`grid size-16 place-items-center text-lg font-semibold leading-[27px] ${theme.avatar}`}
        >
          {initials(name)}
        </div>
        <h1 className="max-w-[620px] text-center text-2xl font-semibold leading-8">
          {title}
        </h1>
        <p className="max-w-[560px] text-center text-[13.5px] leading-[22px] text-[#676e78]">
          {stamp} · İncelemeler genellikle 1–3 iş günü sürüyor.
        </p>

        <section className="w-full max-w-[620px] rounded-3xl border border-[#e4e7ea] px-6 py-[22px]">
          <p className="text-[10.5px] font-semibold leading-4 text-[#858c96]">
            SÜREÇ
          </p>
          <ol>
            {timeline.map((row, index) => (
              <li
                key={row.label}
                className="relative flex items-start gap-3.5 py-3.5"
              >
                {index < timeline.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[11px] top-[42px] h-[calc(100%-28px)] w-px bg-[#e4e7ea]"
                  />
                ) : null}
                {row.icon ? (
                  <Image
                    src={row.icon}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 shrink-0"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="grid w-6 shrink-0 place-items-center"
                  >
                    <span className="size-[18px] rounded-full border border-[#d4d8dd] bg-white" />
                  </span>
                )}
                <div className="flex flex-col gap-[3px]">
                  <p
                    className={`text-[13.5px] font-medium leading-5 ${
                      row.icon ? "text-[#22262b]" : "text-[#676e78]"
                    }`}
                  >
                    {row.label}
                  </p>
                  <p
                    className={`text-xs leading-[18px] ${
                      row.current ? theme.currentText : "text-[#858c96]"
                    }`}
                  >
                    {row.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={`flex w-full max-w-[620px] flex-col gap-3 rounded-xl px-6 py-[22px] ${theme.nextSteps}`}
        >
          <p
            className={`text-[10.5px] font-semibold leading-4 ${theme.nextStepsTitle}`}
          >
            {copy.whatsNext}
          </p>
          <ul className="flex flex-col gap-3">
            {nextSteps.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className={`mt-[7px] size-1.5 shrink-0 rounded-full ${theme.bg}`}
                />
                <span className="text-[12.5px] leading-[19px] text-[#4a5059]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/application-status"
            className="rounded-full border border-[#d4d8dd] bg-white px-5 py-[11px] text-[13px] font-medium leading-5 text-[#4a5059] hover:bg-[#f8f9fa]"
          >
            {copy.viewSubmitted}
          </Link>
          <Link
            href="/"
            className={`rounded-full px-5 py-[11px] text-[13px] font-medium leading-5 text-white ${theme.bg} ${theme.bgHover}`}
          >
            {copy.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
