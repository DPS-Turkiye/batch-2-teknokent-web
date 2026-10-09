import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  ArrowIcon,
  CheckIcon,
  LockIcon,
} from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { useLandingHero, useLandingPointerEffects } from "@/hooks/use-landing";
import { LANDING_PHOTOS } from "@/lib/const/landing";
import { useLandingContent } from "@/hooks/use-landing-content";

export function LandingHero({
  login,
}: {
  login: { href: string; label: string };
}) {
  const landing = useLandingContent();
  const {
    sceneRef,
    layerRef,
    glassRef,
    stepRefs,
    active,
    done,
    matched,
    cursor,
    still,
    onPointerMove,
  } = useLandingHero(landing.hero.sceneSteps.length);
  const pointer = useLandingPointerEffects();
  const words = landing.hero.headline.split(/\s+/);

  return (
    <section className={cx("hero")} onPointerMove={onPointerMove}>
      <div className={cx("wrap")}>
        <div>
          <div className={cx("eyebrow", "eyebrowIn")}>
            {landing.hero.eyebrow}
          </div>
          <h1 aria-label={landing.hero.headline}>
            {words.map((word, index) => (
              <span key={`${word}-${index}`}>
                <span
                  aria-hidden
                  className={cx(
                    "w",
                    word.startsWith(landing.hero.accentPrefix) && "accent",
                  )}
                >
                  <span style={{ "--i": index } as CSSProperties}>{word}</span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className={cx("lead")}>{landing.hero.lead}</p>
          <div className={cx("hero-cta")}>
            <Link
              id="giris"
              className={cx("btn", "btn-or")}
              href={login.href}
              onPointerMove={pointer.magnet}
              onPointerLeave={pointer.reset}
            >
              {login.label}
              <ArrowIcon />
            </Link>
            <a
              className={cx("btn", "btn-ghost")}
              href="#nasil"
              onPointerMove={pointer.magnet}
              onPointerLeave={pointer.reset}
            >
              {landing.ui.howItWorks}
            </a>
          </div>
          <p className={cx("hero-note")}>
            <LockIcon />
            {landing.hero.note}
          </p>
        </div>

        <div
          ref={sceneRef}
          className={cx("scene", matched && "matched")}
          aria-hidden
        >
          <div ref={layerRef} className={cx("layer")}>
            <div className={cx("gp", "blue", "p1")}>
              <div className={cx("grain")} />
            </div>
          </div>
          <div className={cx("toast", matched && "show")}>
            <Image
              className={cx("av")}
              src={LANDING_PHOTOS.nihan}
              alt=""
              width={60}
              height={60}
            />
            <div>
              {landing.hero.match.title}
              <small>{landing.hero.match.detail}</small>
            </div>
            <span className={cx("live")} />
          </div>
          <div ref={glassRef} className={cx("glass")}>
            <div className={cx("glass-top")}>
              <span>{landing.hero.sceneTitle}</span>
              <span className={cx("dots")}>
                {landing.hero.sceneSteps.map((step, index) => (
                  <i key={step} className={cx(index === active && "on")} />
                ))}
              </span>
            </div>
            {landing.hero.sceneSteps.map((step, index) => (
              <div
                key={step}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                className={cx(
                  "hstep",
                  index === active && "on",
                  index < done && "done",
                )}
              >
                <span className={cx("n")}>{index + 1}</span>
                {step}
                <span className={cx("tk")}>
                  <CheckIcon />
                </span>
              </div>
            ))}
          </div>
          {still ? null : (
            <svg
              className={cx("cursor")}
              style={{ transform: cursor }}
              viewBox="0 0 24 24"
            >
              <path
                d="M4 3l16 7-7 2.2L10.8 20z"
                fill="#22262B"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
