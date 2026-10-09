import Link from "next/link";

import { cx } from "@/components/landing/landing-styles";
import { useLandingScroll } from "@/hooks/use-landing";
import { useLandingContent } from "@/hooks/use-landing-content";
import { LanguageSwitch } from "@/components/common/language-switch";

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
}: {
  login: { href: string; label: string };
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
          <LanguageSwitch />
          <Link className={cx("btn", "btn-or")} href={login.href}>
            {login.label}
          </Link>
        </div>
      </header>
    </>
  );
}
