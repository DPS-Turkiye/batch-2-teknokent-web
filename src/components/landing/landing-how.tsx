import Image from "next/image";
import type { CSSProperties } from "react";

import { ArrowIcon, CheckIcon } from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { useLandingSteps } from "@/hooks/use-landing";
import {
  LANDING_AGENDA,
  LANDING_HOW_STEPS,
  LANDING_MATCH_REASON,
  LANDING_MATCHES,
  LANDING_MENTOR_STEPS,
  LANDING_STAGE_ROLES,
  LANDING_STEP_MS,
  LANDING_TASKS,
  LANDING_TOPIC_CHIPS,
} from "@/lib/const/landing";

export function LandingHow() {
  const {
    stageRef,
    stepRefs,
    index: current,
    cycle,
    playing,
    typed,
    checked,
    show,
    onKeyDown,
    togglePlay,
  } = useLandingSteps(LANDING_HOW_STEPS.length);
  const paneClass = (pane: number) => cx("pane", current === pane && "on");
  const role = LANDING_MENTOR_STEPS.has(current)
    ? LANDING_STAGE_ROLES.mentor
    : LANDING_STAGE_ROLES.mentee;

  return (
    <section className={cx("how")} id="nasil">
      <div className={cx("wrap")}>
        <div className={cx("sec-head")}>
          <div className={cx("eyebrow", "rv")}>Mentorluk</div>
          <h2 className={cx("h2", "rvt")}>
            <span className={cx("mask")}>
              <span>Mentorluk süreci</span>
            </span>{" "}
            <span className={cx("mask")}>
              <span>nasıl işler?</span>
            </span>
          </h2>
          <p
            className={cx("lead", "rv")}
            style={{ "--d": "120ms" } as CSSProperties}
          >
            Mentorluk, girişiminizin karşılaştığı problemleri deneyimli
            kişilerle değerlendirmenizi, farklı bakış açıları kazanmanızı ve
            sonraki adımlarınızı netleştirmenizi sağlar.
          </p>
        </div>
        <div className={cx("how-grid")} data-role={role.key}>
          <div
            className={cx("rv")}
            style={{ "--dur": `${LANDING_STEP_MS}ms` } as CSSProperties}
          >
            <div className={cx(!playing && "paused")}>
              <div
                className={cx("steps")}
                role="tablist"
                aria-label="Mentorluk adımları"
              >
                {LANDING_HOW_STEPS.map((step, index) => {
                  const on = current === index;
                  return (
                    <button
                      key={step.title}
                      ref={(element) => {
                        stepRefs.current[index] = element;
                      }}
                      type="button"
                      role="tab"
                      id={`st-${index}`}
                      aria-controls={`pn-${index}`}
                      aria-selected={on}
                      tabIndex={on ? 0 : -1}
                      className={cx("st", on && "on")}
                      onClick={() => show(index)}
                      onKeyDown={(event) => onKeyDown(index, event)}
                    >
                      <span className={cx("no")}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <b>{step.title}</b>
                      <span className={cx("d")}>{step.text}</span>
                      <span className={cx("bar")}>
                        <i key={on ? cycle : undefined} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className={cx("ctrl")}>
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Duraklat" : "Oynat"}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    {playing ? (
                      <>
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </>
                    ) : (
                      <path d="M7 5l12 7-12 7z" />
                    )}
                  </svg>
                </button>
                <span>
                  {playing
                    ? "Otomatik oynatılıyor · adıma tıklayarak geçebilirsin"
                    : "Duraklatıldı · adımlar arasında tıklayarak gezinebilirsin"}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={stageRef}
            className={cx("stage", "rv")}
            data-s={current}
            style={{ "--d": "150ms" } as CSSProperties}
          >
            <div className={cx("skin", "o")} />
            <div className={cx("skin", "b")} />
            <div className={cx("grain")} style={{ opacity: 0.45 }} />
            <span className={cx("role")}>
              <i />
              <span>{role.label}</span>
            </span>

            <div
              className={paneClass(0)}
              id="pn-0"
              role="tabpanel"
              aria-labelledby="st-0"
            >
              <div className={cx("gcard")}>
                <div className={cx("glab")}>Destek almak istediğin konu</div>
                <div className={cx("chips")}>
                  {LANDING_TOPIC_CHIPS.map((chip) => (
                    <span
                      key={chip.label}
                      className={cx("c", chip.selected && "sel")}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className={cx("gcard")}>
                <div className={cx("glab")}>Mevcut problemin</div>
                <div className={cx("type")}>{typed}</div>
                <div className={cx("sendrow")}>
                  <span className={cx("mini-btn")}>
                    Talebi gönder <ArrowIcon size={14} />
                  </span>
                </div>
              </div>
            </div>

            <div
              className={paneClass(1)}
              id="pn-1"
              role="tabpanel"
              aria-labelledby="st-1"
            >
              <div className={cx("mrows")}>
                {LANDING_MATCHES.map((match) => (
                  <div
                    key={match.name}
                    className={cx("mrow", match.selected && "sel")}
                  >
                    <Image
                      className={cx("av")}
                      src={match.photo}
                      alt={match.name}
                      width={40}
                      height={40}
                    />
                    <div className={cx("who")}>
                      <b>{match.name}</b>
                      <small>{match.field}</small>
                    </div>
                    <span className={cx("pill", match.selected && "bl")}>
                      {match.pill}
                    </span>
                  </div>
                ))}
              </div>
              <div className={cx("why")}>
                <b>Neden önerildi?</b>
                {LANDING_MATCH_REASON}
              </div>
            </div>

            <div
              className={paneClass(2)}
              id="pn-2"
              role="tabpanel"
              aria-labelledby="st-2"
            >
              <div className={cx("gcard")}>
                <div className={cx("head2")}>
                  <div>
                    <small>30 Ağustos · 14:00 · 45 dk</small>
                    <b>Ürün konumlandırma kararları</b>
                  </div>
                  <span className={cx("pill", "or")}>4. seans / 6</span>
                </div>
                <div className={cx("glab")}>Gündem</div>
                <ul className={cx("ag")}>
                  {LANDING_AGENDA.map((item, index) => (
                    <li key={item} className={cx(index < checked && "ck")}>
                      <span className={cx("bx")}>
                        <CheckIcon size={12} strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className={paneClass(3)}
              id="pn-3"
              role="tabpanel"
              aria-labelledby="st-3"
            >
              <div className={cx("gcard")}>
                <div className={cx("head2")}>
                  <div>
                    <small>Bu aşamadaki görevlerin</small>
                    <b>MVP · Value proposition &amp; onboarding</b>
                  </div>
                  <span className={cx("pill", "ok")}>3 / 4</span>
                </div>
                {LANDING_TASKS.map((task) => (
                  <div key={task.title} className={cx("task")}>
                    <div className={cx("who")}>
                      {task.title}
                      <small>{task.source}</small>
                    </div>
                    <span className={cx("pill", task.tone)}>{task.status}</span>
                  </div>
                ))}
                <div className={cx("pbar")}>
                  <i />
                </div>
                <div className={cx("prow")}>
                  <span>Aşama ilerlemesi</span>
                  <span>%75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
