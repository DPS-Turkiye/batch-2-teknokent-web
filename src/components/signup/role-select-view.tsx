"use client";

import Link from "next/link";

import { OnboardingTopbar } from "@/components/onboarding/onboarding-layout";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import { SignupRole } from "@/interfaces/signup";
import { useLocale } from "@/components/providers/locale-provider";

const ROLE_CARDS = [
  { role: SignupRole.Founder, tone: OnboardingTone.Mentee, copy: "founder" },
  { role: SignupRole.Mentor, tone: OnboardingTone.Mentor, copy: "mentor" },
] as const;

const BADGE_CLASSES: Record<OnboardingTone, string> = {
  [OnboardingTone.Mentee]: "bg-[#fff4ec] text-[#e86f22]",
  [OnboardingTone.Mentor]: "bg-[#f2f8fc] text-[#1592ea]",
};

const BULLET_CLASSES: Record<OnboardingTone, string> = {
  [OnboardingTone.Mentee]: "bg-[#e86f22]",
  [OnboardingTone.Mentor]: "bg-[#26a4ff]",
};

export function RoleSelectView({
  signedIn,
  onChoose,
}: {
  signedIn: boolean;
  onChoose: (role: SignupRole) => void;
}) {
  const { messages } = useLocale();
  const copy = messages.roleSelect;
  const { exit, exiting } = useOnboardingExit();

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1f2328]">
      <OnboardingTopbar
        exitLabel={signedIn ? copy.exit : undefined}
        onExit={signedIn ? exit : undefined}
        exiting={exiting}
      />
      <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center px-4 py-12 sm:py-[88px]">
        <h1 className="text-center text-2xl font-semibold leading-9 sm:text-[28px]">
          {copy.title}
        </h1>
        <p className="mt-2 text-center text-[13px] leading-5 text-[#4a5059]">
          {copy.intro}
        </p>

        <div className="mt-11 grid w-full gap-5 md:grid-cols-2">
          {ROLE_CARDS.map((card) => {
            const tone = ONBOARDING_TONES[card.tone];
            const text = copy.cards[card.copy];
            return (
              <section
                key={card.role}
                aria-labelledby={`role-${card.role}`}
                className="flex flex-col rounded-2xl border border-[#e3e6ea] bg-white p-5 sm:p-[22px]"
              >
                <span
                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium leading-4 ${BADGE_CLASSES[card.tone]}`}
                >
                  {text.badge}
                </span>
                <h2
                  id={`role-${card.role}`}
                  className="mt-3 text-base font-semibold leading-6"
                >
                  {text.title}
                </h2>
                <p className="mt-3 text-xs leading-5 text-[#4a5059]">
                  {text.description}
                </p>
                <p className="mt-5 text-[10px] font-semibold uppercase leading-4 tracking-[0.04em] text-[#676e78]">
                  {copy.setupSteps}
                </p>
                <ul className="mt-2 flex flex-col gap-2.5 text-xs leading-4 text-[#1f2328]">
                  {text.steps.map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`size-1 rounded-full ${BULLET_CLASSES[card.tone]}`}
                      />
                      {step}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onChoose(card.role)}
                  className={`mt-5 h-10 w-full rounded-full text-[13px] font-medium text-white ${tone.bg} ${tone.bgHover}`}
                >
                  {text.action}
                </button>
              </section>
            );
          })}
        </div>

        <p className="mt-11 text-center text-xs leading-5 text-[#4a5059]">
          {copy.haveCode}{" "}
          <Link href="/invite" className="hover:underline">
            {copy.codeLink}
          </Link>
        </p>
        {signedIn ? null : (
          <p className="mt-3 text-center text-xs leading-5 text-[#1f2328]">
            {messages.register.haveAccount}{" "}
            <Link href="/login" className="font-medium hover:underline">
              {messages.auth.signIn}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
