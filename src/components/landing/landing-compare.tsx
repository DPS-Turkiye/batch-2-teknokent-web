import type { CSSProperties } from "react";

import { ArrowIcon, CheckIcon } from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { useLandingPointerEffects } from "@/hooks/use-landing";
import { LANDING_COMPARE } from "@/lib/const/landing";

function MentoringIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 18c.6-2.4 2.5-3.8 4.5-3.8S13.4 15.6 14 18" />
      <circle cx="9.5" cy="9" r="3" />
      <path d="M15 6.5h5M15 10h5M17 13.5h3" />
    </svg>
  );
}

function TrainingIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3 9.5 12 5l9 4.5-9 4.5z" />
      <path d="M7 11.5V16c1.4 1.3 3 2 5 2s3.6-.7 5-2v-4.5" />
    </svg>
  );
}

export function LandingCompare({ onDifference }: { onDifference: () => void }) {
  const pointer = useLandingPointerEffects();
  const cards = [
    {
      key: "m",
      from: "rv-l",
      delay: 0,
      firstPoint: 200,
      icon: <MentoringIcon />,
      card: LANDING_COMPARE.mentoring,
    },
    {
      key: "e",
      from: "rv-r",
      delay: 120,
      firstPoint: 300,
      icon: <TrainingIcon />,
      card: LANDING_COMPARE.training,
    },
  ];

  return (
    <section id="karsilastirma">
      <div className={cx("wrap")}>
        <div className={cx("sec-head")}>
          <div className={cx("eyebrow", "rv")}>Karşılaştırma</div>
          <h2 className={cx("h2", "rvt")}>
            <span className={cx("mask")}>
              <span>Mentorluk ve eğitim</span>
            </span>{" "}
            <span className={cx("mask")}>
              <span>arasındaki fark nedir?</span>
            </span>
          </h2>
        </div>
        <div className={cx("cmp")}>
          {cards.map(({ key, from, delay, firstPoint, icon, card }) => (
            <article
              key={key}
              className={cx("ccard", key, "rv", from)}
              style={{ "--d": `${delay}ms` } as CSSProperties}
              onPointerMove={pointer.tilt}
              onPointerLeave={pointer.reset}
            >
              <div className={cx("shine")} />
              <div className={cx("ic")}>{icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <ul className={cx("clist")}>
                {card.points.map((point, index) => (
                  <li
                    key={point}
                    className={cx("rv")}
                    style={
                      {
                        "--d": `${firstPoint + index * 100}ms`,
                      } as CSSProperties
                    }
                  >
                    <span className={cx("dot")}>
                      <CheckIcon size={12} strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className={cx("cmp-foot", "rv")}>
          <a className={cx("link")} href="#sss" onClick={onDifference}>
            Hangi desteğe ihtiyacım olduğunu nasıl anlarım? <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
