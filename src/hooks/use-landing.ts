"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { LANDING_STEP_MS } from "@/lib/const/landing";
import { useLandingContent } from "@/hooks/use-landing-content";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function hasFinePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: fine)").matches === true
  );
}

/**
 * The hero scene: the three steps light up one by one with the cursor on them, then "Eşleşme kuruldu"
 * shows, and the loop starts over. With reduced motion it shows the finished state and stays there.
 */
export function useLandingHero(stepCount: number) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [done, setDone] = useState(0);
  const [matched, setMatched] = useState(false);
  const [cursor, setCursor] = useState("translate(80%,90%)");
  const [still, setStill] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const later = (run: () => void, ms: number) =>
      timers.push(window.setTimeout(run, ms));
    if (prefersReducedMotion()) {
      later(() => {
        setStill(true);
        setDone(stepCount);
        setMatched(true);
      }, 0);
      return () => timers.forEach(clearTimeout);
    }
    const pointAt = (index: number) => {
      const scene = sceneRef.current?.getBoundingClientRect();
      const step = stepRefs.current[index]?.getBoundingClientRect();
      if (!scene || !step) return;
      setCursor(
        `translate(${step.left - scene.left + step.width - 30}px,${step.top - scene.top + step.height / 2}px)`,
      );
    };
    const tick = (index: number) => {
      if (index < stepCount) {
        setActive(index);
        pointAt(index);
        later(() => {
          setDone(index + 1);
          if (index + 1 === stepCount) later(() => setMatched(true), 500);
        }, 900);
        later(() => tick(index + 1), 1500);
        return;
      }
      later(() => {
        setMatched(false);
        setDone(0);
        setActive(-1);
        later(() => tick(0), 700);
      }, 3400);
    };
    later(() => tick(0), 1100);
    return () => timers.forEach(clearTimeout);
  }, [stepCount]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const scene = sceneRef.current?.getBoundingClientRect();
    if (!scene || prefersReducedMotion() || !hasFinePointer()) return;
    const x = (event.clientX - scene.left - scene.width / 2) / scene.width;
    const y = (event.clientY - scene.top - scene.height / 2) / scene.height;
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${x * 10}px,${y * 10}px)`;
    }
    if (glassRef.current) {
      glassRef.current.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    }
  }, []);

  return {
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
  };
}

/**
 * "Mentorluk süreci nasıl işler?": the steps play in turn while the stage is on screen, can be paused,
 * and are keyboard-navigable as tabs. `cycle` changes whenever a step is (re)shown, so its progress bar
 * and pane animations restart.
 */
export function useLandingSteps(count: number) {
  const { typedProblem, agenda } = useLandingContent();
  const agendaCount = agenda.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(0);

  const show = useCallback((next: number) => {
    setIndex(next);
    setCycle((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      setStill(true);
      setPlaying(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setCycle((value) => value + 1);
      },
      { threshold: 0.35 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setTimeout(
      () => show((index + 1) % count),
      LANDING_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [playing, visible, index, cycle, count, show]);

  useEffect(() => {
    if (index !== 0) return;
    let typedLength = 0;
    const timer = window.setInterval(
      () => {
        typedLength = still ? typedProblem.length : typedLength + 2;
        setTyped(typedProblem.slice(0, typedLength));
        if (typedLength >= typedProblem.length) clearInterval(timer);
      },
      still ? 0 : 16,
    );
    return () => clearInterval(timer);
  }, [index, cycle, still, typedProblem]);

  useEffect(() => {
    if (index !== 2) return;
    const timers = Array.from({ length: agendaCount }, (_, item) =>
      window.setTimeout(
        () => setChecked(item + 1),
        still ? 0 : 300 + item * 620,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      setChecked(0);
    };
  }, [index, cycle, still, agendaCount]);

  const onKeyDown = (step: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;
    event.preventDefault();
    const next = (step + (forward ? 1 : count - 1)) % count;
    show(next);
    stepRefs.current[next]?.focus();
  };

  return {
    stageRef,
    stepRefs,
    index,
    cycle,
    playing,
    typed: index === 0 ? typed : "",
    checked: index === 2 ? checked : 0,
    show,
    onKeyDown,
    togglePlay: () => {
      if (!playing) setCycle((value) => value + 1);
      setPlaying(!playing);
    },
  };
}

/** SSS: several answers can be open at once; the first one starts open. */
export function useLandingFaq() {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const set = (index: number, value: boolean) =>
    setOpen((current) => {
      const next = new Set(current);
      if (value) next.add(index);
      else next.delete(index);
      return next;
    });
  return {
    isOpen: (index: number) => open.has(index),
    toggle: (index: number) => set(index, !open.has(index)),
    reveal: (index: number) => set(index, true),
  };
}

/** The thin progress bar at the top, the nav border after scrolling, and smooth in-page links. */
export function useLandingScroll() {
  const progressRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    const onScroll = () => {
      const height = root.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty(
        "--p",
        String(height > 0 ? window.scrollY / height : 0),
      );
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.style.scrollBehavior = previous;
    };
  }, []);

  return { progressRef, scrolled };
}

/**
 * Reveal on scroll: only elements below the first screen wait to fade in, so the top of the page is
 * never blank; everything already in view is shown at once, and a 2.5 s fallback reveals the rest.
 */
export function useLandingReveal(
  rootRef: RefObject<HTMLElement | null>,
  classes: { reveal: string; revealText: string; shown: string },
) {
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(
        `.${classes.reveal}, .${classes.revealText}`,
      ),
    );
    const below = elements.filter(
      (element) =>
        element.getBoundingClientRect().top > window.innerHeight * 0.9,
    );
    if (below.length === 0) return;
    elements.forEach((element) => {
      if (!below.includes(element)) element.classList.add(classes.shown);
    });
    const start = window.setTimeout(() => setRevealing(true), 0);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(classes.shown);
          observer.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    below.forEach((element) => observer.observe(element));
    const fallback = window.setTimeout(() => {
      elements.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add(classes.shown);
        }
      });
    }, 2500);
    return () => {
      observer.disconnect();
      clearTimeout(start);
      clearTimeout(fallback);
    };
  }, [rootRef, classes.reveal, classes.revealText, classes.shown]);

  return revealing;
}

/** Tilt and shine on the comparison cards, the CTA spotlight and the "magnetic" buttons (mouse only). */
export function useLandingPointerEffects() {
  const enabled = () => hasFinePointer() && !prefersReducedMotion();
  return {
    tilt: (event: PointerEvent<HTMLElement>) => {
      if (!enabled()) return;
      const card = event.currentTarget;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.transform = `rotateY(${(x - 0.5) * 8}deg) rotateX(${(0.5 - y) * 8}deg) translateY(-4px)`;
    },
    spotlight: (event: PointerEvent<HTMLElement>) => {
      if (!enabled()) return;
      const box = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty(
        "--mx",
        `${event.clientX - box.left}px`,
      );
      event.currentTarget.style.setProperty(
        "--my",
        `${event.clientY - box.top}px`,
      );
    },
    magnet: (event: PointerEvent<HTMLElement>) => {
      if (!enabled()) return;
      const box = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * 0.18}px,${(event.clientY - box.top - box.height / 2) * 0.3}px)`;
    },
    reset: (event: PointerEvent<HTMLElement>) => {
      event.currentTarget.style.transform = "";
    },
  };
}
