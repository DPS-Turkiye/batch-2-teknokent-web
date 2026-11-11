import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useLandingFaq,
  useLandingHero,
  useLandingPointerEffects,
  useLandingReveal,
  useLandingScroll,
  useLandingSteps,
} from "@/hooks/use-landing";
import { LANDING_STEP_MS } from "@/lib/const/landing";
import tr from "@/messages/tr.json";

const TYPED_PROBLEM = tr.landing.typedProblem;
const AGENDA_COUNT = tr.landing.agenda.length;

/** Answers matchMedia the way a browser with these preferences would. */
function mediaMatches({
  reducedMotion = false,
  finePointer = false,
}: {
  reducedMotion?: boolean;
  finePointer?: boolean;
}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches:
        (reducedMotion && query === "(prefers-reduced-motion: reduce)") ||
        (finePointer && query === "(pointer: fine)"),
    })),
  );
}

function boxAt(element: Element, box: Partial<DOMRect>) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
    ...box,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useLandingHero", () => {
  it("shows the finished match at once, and stays still, with reduced motion", () => {
    mediaMatches({ reducedMotion: true });
    const { result } = renderHook(() => useLandingHero(3));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.still).toBe(true);
    expect(result.current.done).toBe(3);
    expect(result.current.matched).toBe(true);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(result.current.active).toBe(-1);
  });

  it("lights the steps in turn, shows the match, then starts over", () => {
    const { result } = renderHook(() => useLandingHero(2));
    expect(result.current.active).toBe(-1);

    act(() => {
      vi.advanceTimersByTime(1_100);
    });
    expect(result.current.active).toBe(0);
    expect(result.current.done).toBe(0);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.done).toBe(1);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.active).toBe(1);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.done).toBe(2);
    expect(result.current.matched).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.matched).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3_500);
    });
    expect(result.current).toMatchObject({
      matched: false,
      done: 0,
      active: -1,
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(result.current.active).toBe(0);
  });

  it("points the cursor at the lit step", () => {
    const { result } = renderHook(() => useLandingHero(1));
    const scene = document.createElement("div");
    const step = document.createElement("div");
    boxAt(scene, { left: 100, top: 50 });
    boxAt(step, { left: 160, top: 90, width: 200, height: 40 });
    result.current.sceneRef.current = scene;
    result.current.stepRefs.current[0] = step;

    act(() => {
      vi.advanceTimersByTime(1_100);
    });

    expect(result.current.cursor).toBe("translate(230px,60px)");
  });

  it("stops its timers on unmount", () => {
    const { unmount } = renderHook(() => useLandingHero(3));
    act(() => {
      vi.advanceTimersByTime(1_100);
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  function Hero() {
    const hero = useLandingHero(3);
    return (
      <div
        data-testid="scene"
        ref={hero.sceneRef}
        onPointerMove={hero.onPointerMove}
      >
        <div data-testid="layer" ref={hero.layerRef} />
        <div data-testid="glass" ref={hero.glassRef} />
      </div>
    );
  }

  it("tilts the scene toward a mouse pointer", () => {
    mediaMatches({ finePointer: true });
    render(<Hero />);
    boxAt(screen.getByTestId("scene"), { width: 200, height: 100 });

    fireEvent.pointerMove(screen.getByTestId("scene"), {
      clientX: 200,
      clientY: 100,
    });

    expect(screen.getByTestId("layer").style.transform).toBe(
      "translate(5px, 5px)",
    );
    expect(screen.getByTestId("glass").style.transform).toBe(
      "perspective(900px) rotateY(3deg) rotateX(-3deg)",
    );
  });

  it("leaves the scene still for touch input", () => {
    mediaMatches({ finePointer: false });
    render(<Hero />);
    boxAt(screen.getByTestId("scene"), { width: 200, height: 100 });

    fireEvent.pointerMove(screen.getByTestId("scene"), {
      clientX: 200,
      clientY: 100,
    });

    expect(screen.getByTestId("layer").style.transform).toBe("");
  });
});

describe("useLandingSteps", () => {
  function Steps() {
    const steps = useLandingSteps(3);
    return (
      <div ref={steps.stageRef}>
        <output data-testid="index">{steps.index}</output>
        <output data-testid="playing">{String(steps.playing)}</output>
        <output data-testid="typed">{steps.typed}</output>
        <output data-testid="checked">{steps.checked}</output>
        {[0, 1, 2].map((step) => (
          <button
            key={step}
            type="button"
            ref={(element) => {
              steps.stepRefs.current[step] = element;
            }}
            onKeyDown={(event) => {
              steps.onKeyDown(step, event);
            }}
          >
            {`Adım ${String(step + 1)}`}
          </button>
        ))}
        <button type="button" onClick={steps.togglePlay}>
          play
        </button>
        <button
          type="button"
          onClick={() => {
            steps.show(2);
          }}
        >
          show agenda
        </button>
      </div>
    );
  }

  const index = () => screen.getByTestId("index").textContent;

  it("types the problem out, two letters at a time, on the first step", () => {
    render(<Steps />);

    act(() => {
      vi.advanceTimersByTime(16 * 3);
    });
    expect(screen.getByTestId("typed").textContent).toBe(
      TYPED_PROBLEM.slice(0, 6),
    );

    act(() => {
      vi.advanceTimersByTime(16 * TYPED_PROBLEM.length);
    });
    expect(screen.getByTestId("typed").textContent).toBe(TYPED_PROBLEM);
  });

  it("moves on to the next step on its own once the stage is shown", () => {
    render(<Steps />);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS);
    });
    expect(index()).toBe("1");

    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS);
    });
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS);
    });
    expect(index()).toBe("0");
  });

  it("holds the current step while paused and goes on after play", () => {
    render(<Steps />);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.click(screen.getByText("play"));
    expect(screen.getByTestId("playing").textContent).toBe("false");
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS * 3);
    });
    expect(index()).toBe("0");

    fireEvent.click(screen.getByText("play"));
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS);
    });
    expect(index()).toBe("1");
  });

  it("checks the agenda items off one by one on the third step", () => {
    render(<Steps />);

    fireEvent.click(screen.getByText("show agenda"));
    expect(screen.getByTestId("checked").textContent).toBe("0");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("checked").textContent).toBe("1");

    act(() => {
      vi.advanceTimersByTime(620 * (AGENDA_COUNT - 1));
    });
    expect(screen.getByTestId("checked").textContent).toBe(
      String(AGENDA_COUNT),
    );
    expect(screen.getByTestId("typed").textContent).toBe("");
  });

  it.each([
    ["ArrowDown", "Adım 2", "1"],
    ["ArrowRight", "Adım 2", "1"],
    ["ArrowUp", "Adım 3", "2"],
    ["ArrowLeft", "Adım 3", "2"],
  ])(
    "moves the tab with %s, wrapping around and moving focus",
    (key, focused, expected) => {
      render(<Steps />);

      fireEvent.keyDown(screen.getByText("Adım 1"), { key });

      expect(index()).toBe(expected);
      expect(document.activeElement).toBe(screen.getByText(focused));
    },
  );

  it("ignores keys other than the arrows", () => {
    render(<Steps />);

    fireEvent.keyDown(screen.getByText("Adım 1"), { key: "Enter" });

    expect(index()).toBe("0");
  });

  it("shows the whole text at once and stays paused with reduced motion", () => {
    mediaMatches({ reducedMotion: true });
    render(<Steps />);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("playing").textContent).toBe("false");
    expect(screen.getByTestId("typed").textContent).toBe(TYPED_PROBLEM);
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS * 2);
    });
    expect(index()).toBe("0");
  });

  it("plays only while the stage is on screen", () => {
    let report: (entries: { isIntersecting: boolean }[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { unmount } = render(<Steps />);

    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS * 2);
    });
    expect(index()).toBe("0");

    act(() => report([{ isIntersecting: true }]));
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS);
    });
    expect(index()).toBe("1");

    act(() => report([{ isIntersecting: false }]));
    act(() => {
      vi.advanceTimersByTime(LANDING_STEP_MS * 2);
    });
    expect(index()).toBe("1");

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("useLandingFaq", () => {
  it("starts with the first answer open and opens several at once", () => {
    const { result } = renderHook(() => useLandingFaq());
    expect(result.current.isOpen(0)).toBe(true);
    expect(result.current.isOpen(1)).toBe(false);

    act(() => result.current.toggle(1));
    expect(result.current.isOpen(0)).toBe(true);
    expect(result.current.isOpen(1)).toBe(true);

    act(() => result.current.toggle(0));
    expect(result.current.isOpen(0)).toBe(false);

    act(() => result.current.reveal(1));
    expect(result.current.isOpen(1)).toBe(true);
  });
});

describe("useLandingScroll", () => {
  function setScroll(scrollY: number, scrollHeight: number) {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: scrollY,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: scrollHeight,
    });
  }

  afterEach(() => {
    Reflect.deleteProperty(window, "scrollY");
    Reflect.deleteProperty(document.documentElement, "scrollHeight");
  });

  it("scrolls smoothly while mounted and puts the old behavior back after", () => {
    document.documentElement.style.scrollBehavior = "auto";
    const { unmount } = renderHook(() => useLandingScroll());

    expect(document.documentElement.style.scrollBehavior).toBe("smooth");

    unmount();
    expect(document.documentElement.style.scrollBehavior).toBe("auto");
  });

  it("marks the nav scrolled past 8px and fills the progress bar", () => {
    setScroll(0, window.innerHeight + 1_000);
    const { result } = renderHook(() => useLandingScroll());
    const bar = document.createElement("div");
    result.current.progressRef.current = bar;
    expect(result.current.scrolled).toBe(false);

    setScroll(250, window.innerHeight + 1_000);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.scrolled).toBe(true);
    expect(bar.style.getPropertyValue("--p")).toBe("0.25");
  });

  it("reads a page shorter than the window as no progress", () => {
    setScroll(20, 10);
    const { result } = renderHook(() => useLandingScroll());
    const bar = document.createElement("div");
    result.current.progressRef.current = bar;

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(bar.style.getPropertyValue("--p")).toBe("0");
  });
});

describe("useLandingReveal", () => {
  const classes = { reveal: "reveal", revealText: "reveal-text", shown: "on" };
  let report: (entries: { isIntersecting: boolean; target: Element }[]) => void;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();

  beforeEach(() => {
    observe.mockClear();
    unobserve.mockClear();
    disconnect.mockClear();
    report = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe = observe;
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
  });

  function Page() {
    const rootRef = useRef<HTMLElement>(null);
    const revealing = useLandingReveal(rootRef, classes);
    return (
      <main ref={rootRef} data-revealing={String(revealing)}>
        <p className="reveal" data-testid="top">
          Üst
        </p>
        <p className="reveal-text" data-testid="below">
          Alt
        </p>
        <p className="reveal" data-testid="far">
          En alt
        </p>
      </main>
    );
  }

  /** Where each element sits; "top" is in view, the others start below the first screen. */
  let heights = new Map<string, number>();

  /** The elements are measured in an effect, so they are placed on a prototype spy before render. */
  function renderPage() {
    heights = new Map([
      ["below", window.innerHeight * 0.95],
      ["far", window.innerHeight * 3],
    ]);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const top = heights.get(this.dataset.testid ?? "") ?? 0;
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 0,
          bottom: top,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      },
    );
    return render(<Page />);
  }

  it("shows what is already in view at once and watches the rest", () => {
    renderPage();

    expect(screen.getByTestId("top")).toHaveClass("on");
    expect(screen.getByTestId("below")).not.toHaveClass("on");
    expect(observe.mock.calls.map(([element]) => element)).toEqual([
      screen.getByTestId("below"),
      screen.getByTestId("far"),
    ]);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("main")).toHaveAttribute("data-revealing", "true");
  });

  it("fades an element in once it scrolls into view and stops watching it", () => {
    renderPage();
    const below = screen.getByTestId("below");

    act(() => report([{ isIntersecting: false, target: below }]));
    expect(below).not.toHaveClass("on");

    act(() => report([{ isIntersecting: true, target: below }]));
    expect(below).toHaveClass("on");
    expect(unobserve).toHaveBeenCalledWith(below);
  });

  it("reveals whatever reached the window after 2.5 s even without an observer report", () => {
    renderPage();
    heights.set("below", window.innerHeight * 0.5);

    act(() => {
      vi.advanceTimersByTime(2_500);
    });

    expect(screen.getByTestId("below")).toHaveClass("on");
    expect(screen.getByTestId("far")).not.toHaveClass("on");
  });

  it("stops watching on unmount", () => {
    const { unmount } = renderPage();

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing with reduced motion, leaving every element as rendered", () => {
    mediaMatches({ reducedMotion: true });
    renderPage();

    expect(screen.getByTestId("top")).not.toHaveClass("on");
    expect(observe).not.toHaveBeenCalled();
    expect(screen.getByRole("main")).toHaveAttribute("data-revealing", "false");
  });
});

describe("useLandingPointerEffects", () => {
  function Card() {
    const effects = useLandingPointerEffects();
    return (
      <>
        <div data-testid="tilt" onPointerMove={effects.tilt} />
        <div data-testid="spotlight" onPointerMove={effects.spotlight} />
        <div
          data-testid="magnet"
          onPointerMove={effects.magnet}
          onPointerLeave={effects.reset}
        />
      </>
    );
  }

  function moveOver(testId: string) {
    const element = screen.getByTestId(testId);
    boxAt(element, { left: 0, top: 0, width: 200, height: 100 });
    fireEvent.pointerMove(element, { clientX: 150, clientY: 25 });
    return element;
  }

  it("tilts a card toward a mouse pointer and lights where it points", () => {
    mediaMatches({ finePointer: true });
    render(<Card />);

    const card = moveOver("tilt");

    expect(card.style.getPropertyValue("--mx")).toBe("75%");
    expect(card.style.getPropertyValue("--my")).toBe("25%");
    expect(card.style.transform).toBe(
      "rotateY(2deg) rotateX(2deg) translateY(-4px)",
    );
  });

  it("moves the spotlight to the pointer in pixels", () => {
    mediaMatches({ finePointer: true });
    render(<Card />);

    const spotlight = moveOver("spotlight");

    expect(spotlight.style.getPropertyValue("--mx")).toBe("150px");
    expect(spotlight.style.getPropertyValue("--my")).toBe("25px");
  });

  it("pulls a magnetic button toward the pointer and lets it go on leave", () => {
    mediaMatches({ finePointer: true });
    render(<Card />);

    const button = moveOver("magnet");
    expect(button.style.transform).toBe("translate(9px, -7.5px)");

    fireEvent.pointerLeave(button);
    expect(button.style.transform).toBe("");
  });

  it.each([
    ["a touch screen", { finePointer: false }],
    ["reduced motion", { finePointer: true, reducedMotion: true }],
  ])("leaves every effect off for %s", (_case, preferences) => {
    mediaMatches(preferences);
    render(<Card />);

    expect(moveOver("tilt").style.transform).toBe("");
    expect(moveOver("spotlight").style.getPropertyValue("--mx")).toBe("");
    expect(moveOver("magnet").style.transform).toBe("");
  });
});
