import Link from "next/link";

import { LanguageSwitch } from "@/components/common/language-switch";
import { cx } from "@/components/landing/landing-styles";
import { useLandingScroll } from "@/hooks/use-landing";
import { useLandingContent } from "@/hooks/use-landing-content";
import type { LandingLink } from "@/types/landing";

export function LandingLogo({ withTag = false }: { withTag?: boolean }) {
  const landing = useLandingContent();
  return (
    <a className={cx("logo")} href="#top" aria-label={landing.ui.homeLabel}>
      menton
      {withTag ? <small>{landing.hero.eyebrow}</small> : null}
    </a>
  );
}

export function LandingNav({
  login,
  signup,
}: {
  login: LandingLink;
  signup: LandingLink | null;
}) {
  const landing = useLandingContent();
  const { progressRef, scrolled } = useLandingScroll();
  return (
    <>
      <div ref={progressRef} className={cx("progress-top")} aria-hidden />
      <header className={cx("nav", scrolled && "scrolled")}>
        <div className={cx("wrap")}>
          <LandingLogo withTag />
          <nav className={cx("nav-links")} aria-label={landing.ui.mainMenu}>
            {landing.navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className={cx("nav-actions")}>
            <LanguageSwitch />
            <div className={cx("nav-auth-links")}>
              <Link className={cx("btn", "btn-or")} href={login.href}>
                {login.label}
              </Link>
              {signup ? (
                <Link className={cx("btn", "btn-ghost")} href={signup.href}>
                  {signup.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
