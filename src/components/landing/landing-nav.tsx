import Link from "next/link";

import { cx } from "@/components/landing/landing-styles";
import { useLandingScroll } from "@/hooks/use-landing";
import { LANDING_HERO, LANDING_NAV_LINKS } from "@/lib/const/landing";

export function LandingLogo({ withTag = false }: { withTag?: boolean }) {
  return (
    <a className={cx("logo")} href="#top" aria-label="menton ana sayfa">
      menton
      {withTag ? <small>{LANDING_HERO.eyebrow}</small> : null}
    </a>
  );
}

export function LandingNav({
  login,
}: {
  login: { href: string; label: string };
}) {
  const { progressRef, scrolled } = useLandingScroll();
  return (
    <>
      <div ref={progressRef} className={cx("progress-top")} aria-hidden />
      <header className={cx("nav", scrolled && "scrolled")}>
        <div className={cx("wrap")}>
          <LandingLogo withTag />
          <nav className={cx("nav-links")} aria-label="Ana menü">
            {LANDING_NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <Link className={cx("btn", "btn-or")} href={login.href}>
            {login.label}
          </Link>
        </div>
      </header>
    </>
  );
}
