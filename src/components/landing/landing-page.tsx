"use client";

import { useRef } from "react";

import { LandingAnnouncements } from "@/components/landing/landing-announcements";
import { LandingCompare } from "@/components/landing/landing-compare";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHow } from "@/components/landing/landing-how";
import { LandingNav } from "@/components/landing/landing-nav";
import { cx, styles } from "@/components/landing/landing-styles";
import { useLandingFaq, useLandingReveal } from "@/hooks/use-landing";
import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { LANDING_FAQ_DIFFERENCE_INDEX } from "@/lib/const/landing";

const REVEAL_CLASSES = {
  reveal: styles.rv,
  revealText: styles.rvt,
  shown: styles.in,
};

/** menton.com.tr's front page. */
export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const revealing = useLandingReveal(rootRef, REVEAL_CLASSES);
  const faq = useLandingFaq();
  const destination = usePublicSessionDestination();
  const login = { href: destination.href, label: destination.label };

  return (
    <div ref={rootRef} className={cx("page", revealing && "revealing")}>
      <LandingNav login={login} signup={destination.signup} />
      <main id="top">
        <LandingHero action={destination.primaryAction} />
        <LandingAnnouncements />
        <LandingHow />
        <LandingCompare
          onDifference={() => faq.reveal(LANDING_FAQ_DIFFERENCE_INDEX)}
        />
        <LandingFaq faq={faq} />
        <LandingCta action={destination.primaryAction} />
      </main>
      <LandingFooter action={destination.primaryAction} />
    </div>
  );
}
