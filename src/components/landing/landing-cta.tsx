import Link from "next/link";

import { ArrowIcon } from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { useLandingPointerEffects } from "@/hooks/use-landing";
import { useLandingContent } from "@/hooks/use-landing-content";

export function LandingCta({
  login,
}: {
  login: { href: string; label: string };
}) {
  const landing = useLandingContent();
  const pointer = useLandingPointerEffects();
  return (
    <section className={cx("cta")}>
      <div className={cx("wrap")}>
        <div className={cx("cta-box", "rv")} onPointerMove={pointer.spotlight}>
          <div className={cx("spot")} />
          <div className={cx("grain")} style={{ zIndex: -1, opacity: 0.35 }} />
          <h2>{landing.cta.title}</h2>
          <p>{landing.cta.text}</p>
          <div className={cx("row")}>
            <Link
              className={cx("btn", "btn-white")}
              href={login.href}
              onPointerMove={pointer.magnet}
              onPointerLeave={pointer.reset}
            >
              {login.label} <ArrowIcon />
            </Link>
            <a
              className={cx("btn", "btn-glass")}
              href="#nasil"
              onPointerMove={pointer.magnet}
              onPointerLeave={pointer.reset}
            >
              {landing.ui.howItWorks}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
