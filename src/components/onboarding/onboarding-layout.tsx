"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { MentonWordmark } from "@/components/common/menton-wordmark";

import {
  ONBOARDING_HELP_HREF,
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useLocale } from "@/components/providers/locale-provider";

export function OnboardingTopbar({
  exitLabel,
  onExit,
  exiting = false,
}: {
  exitLabel?: string;
  onExit?: () => void;
  exiting?: boolean;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  return (
    <header className="border-b border-[#eceef0] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-[14px] sm:px-8 lg:px-[120px]">
        <MentonWordmark />
        <nav className="flex items-center gap-5 text-[13px] leading-5">
          <a
            href={ONBOARDING_HELP_HREF}
            className="text-[#676e78] hover:underline"
          >
            Yardım
          </a>
          {exitLabel && onExit ? (
            <button
              type="button"
              onClick={onExit}
              disabled={exiting}
              className="font-medium text-[#4a5059] hover:underline disabled:opacity-60"
            >
              {exiting ? copy.exiting : exitLabel}
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export interface OnboardingRailStep {
  title: string;
  hint: string;
}

export function OnboardingRail({
  tone,
  steps,
  currentIndex,
  note,
  showProgress = false,
  onStepClick,
}: {
  tone: OnboardingTone;
  steps: OnboardingRailStep[];
  currentIndex: number;
  note: string;
  showProgress?: boolean;
  onStepClick?: (index: number) => void;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  const theme = ONBOARDING_TONES[tone];
  const percent = Math.round((currentIndex / steps.length) * 100);
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[300px] lg:shrink-0">
      {showProgress ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between">
            <p className="text-[12.5px] font-medium leading-[19px] text-[#22262b]">
              Adım {Math.min(currentIndex + 1, steps.length)} / {steps.length}
            </p>
            <p className="text-xs leading-[18px] text-[#676e78]">
              %{percent} tamam
            </p>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#eceef0]"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={copy.progress}
          >
            <div
              className={`h-1.5 rounded-full ${theme.bg}`}
              style={{ width: `${Math.max(percent, 1.5)}%` }}
            />
          </div>
        </div>
      ) : null}
      <ol className="flex flex-col gap-1.5" aria-label={copy.stepsLabel}>
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          const content = (
            <>
              {done ? (
                <Image
                  src={theme.stepDoneIcon}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 shrink-0"
                />
              ) : (
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold leading-[17px] ${
                    current
                      ? `${theme.bg} text-white`
                      : "bg-[#f3f4f6] text-[#858c96]"
                  }`}
                >
                  {index + 1}
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
                <span
                  className={`text-[13px] font-medium leading-5 ${
                    current
                      ? "text-[#22262b]"
                      : done
                        ? "text-[#4a5059]"
                        : "text-[#676e78]"
                  }`}
                >
                  {step.title}
                </span>
                <span
                  className={`text-[11.5px] leading-[17px] ${
                    done ? "text-[#0f7a4d]" : "text-[#858c96]"
                  }`}
                >
                  {done ? copy.done : step.hint}
                </span>
              </span>
            </>
          );
          const className = `flex w-full items-start gap-3 rounded-[10px] px-3.5 py-3 ${
            current ? theme.soft : ""
          }`;
          return (
            <li key={step.title} aria-current={current ? "step" : undefined}>
              {done && onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={`${className} hover:bg-[#f8f9fa]`}
                >
                  {content}
                </button>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
      <div
        className={`flex flex-col gap-2 rounded-[10px] px-4 py-3.5 ${theme.railNote}`}
      >
        <p className="text-[10.5px] font-semibold leading-4 text-[#858c96]">
          {copy.whoSees}
        </p>
        <p className="text-xs leading-[18px] text-[#4a5059]">{note}</p>
      </div>
    </aside>
  );
}

export function OnboardingFooter({
  tone,
  onBack,
  backDisabled = false,
  onSaveDraft,
  saveDisabled = false,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  status,
}: {
  tone: OnboardingTone;
  onBack: () => void;
  backDisabled?: boolean;
  onSaveDraft?: () => void;
  saveDisabled?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  status?: ReactNode;
}) {
  const { messages } = useLocale();
  const copy = messages.onboarding;
  const theme = ONBOARDING_TONES[tone];
  return (
    <footer className="border-t border-[#eceef0] bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pb-5 pt-4 sm:px-8 lg:px-[230px]">
        <button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          className="rounded-full px-5 py-[11px] text-[13px] font-medium leading-5 text-[#4a5059] hover:bg-[#f8f9fa] disabled:invisible"
        >
          {copy.back}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {status}
          {onSaveDraft ? (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saveDisabled}
              className="rounded-full border border-[#d4d8dd] bg-white px-5 py-[11px] text-[13px] font-medium leading-5 text-[#4a5059] hover:bg-[#f8f9fa] disabled:opacity-60"
            >
              {copy.saveDraft}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className={`rounded-full px-5 py-[11px] text-[13px] font-medium leading-5 text-white disabled:cursor-not-allowed disabled:opacity-50 ${theme.bg} ${theme.bgHover}`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </footer>
  );
}

/** Top bar, left rail, content column and footer, as every wizard step draws them. */
export function OnboardingLayout({
  topbar,
  rail,
  title,
  subtitle,
  children,
  footer,
}: {
  topbar: ReactNode;
  rail: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#22262b]">
      {topbar}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-4 pb-14 pt-10 sm:px-8 lg:flex-row lg:items-start lg:px-[230px]">
        {rail}
        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold leading-9">{title}</h1>
            <p className="max-w-[600px] text-[13.5px] leading-5 text-[#676e78]">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </main>
      {footer}
    </div>
  );
}
