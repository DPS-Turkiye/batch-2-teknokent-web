import Image from "next/image";
import type { CSSProperties } from "react";

import { ArrowIcon, CheckIcon } from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { LANDING_ANNOUNCEMENTS, LANDING_PHOTOS } from "@/lib/const/landing";
import { type LandingAnnouncement, LandingMock } from "@/types/landing";

const CALENDAR_DAYS = 21;
const CALENDAR_TODAY = 12;
const CALENDAR_RANGE_END = 19;

function Mock({ mock }: { mock: LandingMock }) {
  if (mock === LandingMock.Calendar) {
    return (
      <div className={cx("mock")}>
        <div className={cx("mh")}>
          <span>Başvuru dönemi</span>
          <span className={cx("pill", "or")}>Açık</span>
        </div>
        <div className={cx("cal")}>
          {Array.from({ length: CALENDAR_DAYS }, (_, day) => (
            <i
              key={day}
              className={cx(
                day === CALENDAR_TODAY
                  ? "on"
                  : day > CALENDAR_TODAY && day < CALENDAR_RANGE_END && "rg",
              )}
            />
          ))}
        </div>
      </div>
    );
  }
  if (mock === LandingMock.Training) {
    return (
      <div className={cx("mock")}>
        <div className={cx("mh")}>
          <span>Grup eğitimi</span>
          <span className={cx("pill", "bl")}>3 Ağu</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={cx("avs")}>
            {Object.values(LANDING_PHOTOS).map((photo) => (
              <Image key={photo} src={photo} alt="" width={30} height={30} />
            ))}
          </div>
          <div style={{ display: "grid", gap: 5, flex: 1 }}>
            <span className={cx("ln")} />
            <span className={cx("ln")} style={{ maxWidth: "60%" }} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cx("mock")}>
      <div className={cx("mh")}>
        <span>Başvuru belgeleri</span>
        <span className={cx("pill")}>2 / 3</span>
      </div>
      {["100%", "70%", "50%"].map((width, row) => (
        <div key={width} className={cx("chk")}>
          <b className={cx(row === 2 && "no")}>
            {row < 2 ? <CheckIcon size={10} strokeWidth={3.4} /> : null}
          </b>
          <span className={cx("ln")} style={{ maxWidth: width }} />
        </div>
      ))}
    </div>
  );
}

function AnnouncementCard({
  item,
  hidden,
}: {
  item: LandingAnnouncement;
  hidden: boolean;
}) {
  return (
    <article className={cx("acard")} aria-hidden={hidden || undefined}>
      <div
        className={cx(
          "thumb",
          item.mock === LandingMock.Training ? "blue" : "orange",
        )}
      >
        <div className={cx("grain")} />
        <Mock mock={item.mock} />
      </div>
      <div className={cx("abody")}>
        <div className={cx("ameta")}>
          <span className={cx("tag", item.tone)}>{item.tag}</span>
          <span className={cx("date")}>{item.date}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        <a
          className={cx("link")}
          href="#duyurular"
          tabIndex={hidden ? -1 : undefined}
        >
          Detayları görüntüle <ArrowIcon />
        </a>
      </div>
    </article>
  );
}

/** The track holds the list four times over: two visible copies and two for the seamless loop. */
export function LandingAnnouncements() {
  const rows = [false, false, true, true];
  return (
    <section className={cx("ann")} id="duyurular">
      <div className={cx("wrap", "ann-head")}>
        <div className={cx("sec-head")}>
          <div className={cx("eyebrow", "rv")}>Duyurular</div>
          <h2 className={cx("h2", "rvt")}>
            <span className={cx("mask")}>
              <span>Son gelişmeler</span>
            </span>
          </h2>
          <p
            className={cx("lead", "rv")}
            style={{ "--d": "120ms" } as CSSProperties}
          >
            Programlar, eğitimler ve etkinliklerle ilgili son gelişmeleri takip
            edin.
          </p>
        </div>
        <a className={cx("link", "rv")} href="#duyurular">
          Tüm duyuruları görüntüle <ArrowIcon />
        </a>
      </div>
      <div
        className={cx("marquee")}
        aria-label="Duyurular (üzerine gelince durur)"
      >
        <div className={cx("track")}>
          {rows.flatMap((hidden, copy) =>
            LANDING_ANNOUNCEMENTS.map((item) => (
              <AnnouncementCard
                key={`${copy}-${item.title}`}
                item={item}
                hidden={hidden}
              />
            )),
          )}
        </div>
      </div>
    </section>
  );
}
