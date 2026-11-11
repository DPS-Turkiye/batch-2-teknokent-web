import Image from "next/image";

import { ArrowIcon, CheckIcon } from "@/components/landing/landing-icons";
import { cx } from "@/components/landing/landing-styles";
import { useLandingSteps } from "@/hooks/use-landing";
import { useLandingContent } from "@/hooks/use-landing-content";
import { LANDING_MENTOR_STEPS, LANDING_STEP_MS } from "@/lib/const/landing";

export function LandingHow() {
  const landing = useLandingContent();
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
  } = useLandingSteps(landing.howSteps.length);
  const paneClass = (pane: number) => cx("pane", current === pane && "on");
  const role = LANDING_MENTOR_STEPS.has(current)
    ? landing.stageRoles.mentor
    : landing.stageRoles.mentee;

  return (
    <section className={cx("how")} id="nasil">
      <div className={cx("wrap")}>
        <div className={cx("sec-head")}>
          <div className={cx("eyebrow", "rv")}>{landing.ui.howEyebrow}</div>
          <h2 className={cx("h2", "rvt")}>
            <span className={cx("mask")}>
              <span>{landing.ui.howTitleStart}</span>
            </span>{" "}
            <span className={cx("mask")}>
              <span>{landing.ui.howTitleEnd}</span>
            </span>
          </h2>
          <p className={cx("lead", "rv")} style={{ "--d": "120ms" }}>
            {landing.ui.howLead}
          </p>
        </div>
        <div className={cx("how-grid")} data-role={role.key}>
          <div className={cx("rv")} style={{ "--dur": `${LANDING_STEP_MS}ms` }}>
            <div className={cx(!playing && "paused")}>
              <div
                className={cx("steps")}
                role="tablist"
                aria-label={landing.ui.howStepsLabel}
              >
                {landing.howSteps.map((step, index) => {
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
                  {playing ? landing.ui.autoplaying : landing.ui.paused}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={stageRef}
            className={cx("stage", "rv")}
            data-s={current}
            style={{ "--d": "150ms" }}
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
                <div className={cx("glab")}>{landing.ui.supportTopic}</div>
                <div className={cx("chips")}>
                  {landing.topicChips.map((chip) => (
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
                <div className={cx("glab")}>{landing.ui.currentProblem}</div>
                <div className={cx("type")}>{typed}</div>
                <div className={cx("sendrow")}>
                  <span className={cx("mini-btn")}>
                    {landing.ui.sendRequest} <ArrowIcon size={14} />
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
                {landing.matches.map((match) => (
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
                <b>{landing.ui.whyRecommended}</b>
                {landing.matchReason}
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
                    <small>{landing.ui.meetingWhen}</small>
                    <b>{landing.ui.meetingTitle}</b>
                  </div>
                  <span className={cx("pill", "or")}>{landing.ui.session}</span>
                </div>
                <div className={cx("glab")}>{landing.ui.agendaLabel}</div>
                <ul className={cx("ag")}>
                  {landing.agenda.map((item, index) => (
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
                    <small>{landing.ui.stageTasks}</small>
                    <b>{landing.ui.stageName}</b>
                  </div>
                  <span className={cx("pill", "ok")}>3 / 4</span>
                </div>
                {landing.tasks.map((task) => (
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
                  <span>{landing.ui.stageProgress}</span>
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
