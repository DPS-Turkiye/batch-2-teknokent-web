import Link from "next/link";

import { LandingLogo } from "@/components/landing/landing-nav";
import { cx } from "@/components/landing/landing-styles";
import { LANDING_FOOTER } from "@/lib/const/landing";

export function LandingFooter({
  login,
}: {
  login: { href: string; label: string };
}) {
  return (
    <footer>
      <div className={cx("wrap")}>
        <div className={cx("fgrid")}>
          <div className={cx("fbrand")}>
            <LandingLogo />
            <p>
              <b>{LANDING_FOOTER.tagline}</b> {LANDING_FOOTER.text}
            </p>
            <Link className={cx("btn", "btn-or")} href={login.href}>
              {login.label}
            </Link>
          </div>
          {LANDING_FOOTER.columns.map((column) => (
            <div key={column.title} className={cx("fcol")}>
              <h4>{column.title}</h4>
              {column.links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={cx("fbot")}>
          <span>{LANDING_FOOTER.copyright}</span>
          <span>{LANDING_FOOTER.tagline.replace(/\.$/, "")}</span>
        </div>
      </div>
    </footer>
  );
}
