"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { OnboardingTopbar } from "@/components/onboarding/onboarding-layout";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { OdtuSignupBanner } from "@/components/signup/odtu-signup-banner";
import { useLoginChoices } from "@/hooks/use-login-choices";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import type { Edition } from "@/interfaces/edition";
import type { SignupRole } from "@/interfaces/signup";
import { SignupCardCopy, signupCards } from "@/lib/signup-cards";

/** Badge, bullets and button of each card: Girişimci orange, Mentor blue, the İŞKUR student ODTÜ red. */
const CARD_STYLES: Record<
  SignupCardCopy,
  { badge: string; bullet: string; button: string }
> = {
  [SignupCardCopy.Founder]: {
    badge: "bg-[#fff4ec] text-[#e86f22]",
    bullet: "bg-[#e86f22]",
    button: `${ONBOARDING_TONES[OnboardingTone.Mentee].bg} ${ONBOARDING_TONES[OnboardingTone.Mentee].bgHover}`,
  },
  [SignupCardCopy.Mentor]: {
    badge: "bg-[#f2f8fc] text-[#1592ea]",
    bullet: "bg-[#26a4ff]",
    button: `${ONBOARDING_TONES[OnboardingTone.Mentor].bg} ${ONBOARDING_TONES[OnboardingTone.Mentor].bgHover}`,
  },
  // TEST UI: placeholder until the design team's screen; replace when it arrives.
  // The İŞKUR student card's wording is a stand-in until Arya confirms it; its look follows Figma's ODTÜ card.
  [SignupCardCopy.Student]: {
    badge: "bg-brand-odtu-bg text-brand-odtu-primary",
    bullet: "bg-brand-odtu-primary",
    button: "bg-brand-odtu-primary hover:opacity-90",
  },
};

export function RoleSelectView({
  edition,
  signedIn,
  onChoose,
}: {
  edition: Edition;
  signedIn: boolean;
  onChoose: (role: SignupRole) => void;
}) {
  const t = useTranslations();
  const copy = useTranslations("roleSelect");
  const { exit, exiting } = useOnboardingExit();
  const cards = signupCards(edition);
  const choices = useLoginChoices(edition);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1f2328]">
      <OnboardingTopbar
        exitLabel={signedIn ? copy("exit") : undefined}
        onExit={signedIn ? exit : undefined}
        exiting={exiting}
      />
      <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center px-4 py-12 sm:py-[88px]">
        <h1 className="text-center text-2xl font-semibold leading-9 sm:text-[28px]">
          {copy("title")}
        </h1>
        <p className="mt-2 text-center text-[13px] leading-5 text-[#4a5059]">
          {copy("intro")}
        </p>

        {choices.odtu ? (
          <div className="mt-11 w-full">
            <OdtuSignupBanner />
          </div>
        ) : null}

        <div
          className={`mt-11 grid w-full gap-5 ${cards.length > 1 ? "md:grid-cols-2" : "max-w-[430px]"}`}
        >
          {cards.map((card) => {
            const style = CARD_STYLES[card.copy];
            return (
              <section
                key={card.role}
                aria-labelledby={`role-${card.role}`}
                className="flex flex-col rounded-2xl border border-[#e3e6ea] bg-white p-5 sm:p-[22px]"
              >
                <span
                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium leading-4 ${style.badge}`}
                >
                  {copy(`cards.${card.copy}.badge`)}
                </span>
                <h2
                  id={`role-${card.role}`}
                  className="mt-3 text-base font-semibold leading-6"
                >
                  {copy(`cards.${card.copy}.title`)}
                </h2>
                <p className="mt-3 text-xs leading-5 text-[#4a5059]">
                  {copy(`cards.${card.copy}.description`)}
                </p>
                <p className="mt-5 text-[10px] font-semibold uppercase leading-4 tracking-[0.04em] text-[#676e78]">
                  {copy("setupSteps")}
                </p>
                <ul className="mt-2 flex flex-col gap-2.5 text-xs leading-4 text-[#1f2328]">
                  {(copy.raw(`cards.${card.copy}.steps`) as string[]).map(
                    (step) => (
                      <li key={step} className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-1 rounded-full ${style.bullet}`}
                        />
                        {step}
                      </li>
                    ),
                  )}
                </ul>
                <button
                  type="button"
                  onClick={() => onChoose(card.role)}
                  className={`mt-5 h-10 w-full rounded-full text-[13px] font-medium text-white ${style.button}`}
                >
                  {copy(`cards.${card.copy}.action`)}
                </button>
              </section>
            );
          })}
        </div>

        {choices.invite ? (
          <p className="mt-11 text-center text-xs leading-5 text-[#4a5059]">
            {copy("haveCode")}{" "}
            <Link href="/invite" className="hover:underline">
              {copy("codeLink")}
            </Link>
          </p>
        ) : null}
        {signedIn ? null : (
          <p className="mt-3 text-center text-xs leading-5 text-[#1f2328]">
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="font-medium hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
