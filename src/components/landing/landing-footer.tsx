import Link from "next/link";

import { LandingLogo } from "@/components/landing/landing-nav";
import { cx } from "@/components/landing/landing-styles";
import { useLandingContent } from "@/hooks/use-landing-content";
import type { LandingLink } from "@/types/landing";

export function LandingFooter({ action }: { action: LandingLink }) {
  const landing = useLandingContent();
  return (
    <footer>
      <div className={cx("wrap")}>
        <div className={cx("fgrid")}>
          <div className={cx("fbrand")}>
            <LandingLogo />
            <p>
              <b>{landing.footer.tagline}</b> {landing.footer.text}
            </p>
            <Link className={cx("btn", "btn-or")} href={action.href}>
              {action.label}
            </Link>
          </div>
          {landing.footer.columns.map((column) => (
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
          <span>{landing.footer.copyright}</span>
          <span>{landing.footer.tagline.replace(/\.$/, "")}</span>
        </div>
      </div>
    </footer>
  );
}
