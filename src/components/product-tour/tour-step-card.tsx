"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { Button, ButtonSize } from "@/components/ia/button";
import { CARD_FALLBACK_HEIGHT, placeCard } from "@/lib/product-tour";
import {
  CardPlacement,
  type Box,
  type TourStepKey,
} from "@/types/product-tour";

const ARROW_SIZE = 14;

function arrowStyle(
  placement: CardPlacement,
  offset: number | null,
): CSSProperties | null {
  if (offset === null) return null;
  const along = offset - ARROW_SIZE / 2;
  const edge = -ARROW_SIZE / 2;
  switch (placement) {
    case CardPlacement.Below:
      return { top: edge, left: along };
    case CardPlacement.Above:
      return { bottom: edge, left: along };
    case CardPlacement.Right:
      return { left: edge, top: along };
    case CardPlacement.Left:
      return { right: edge, top: along };
    case CardPlacement.Docked:
    case CardPlacement.Centered:
      return null;
  }
}

/**
 * The "Tur / Adım kartı": step count, progress, what this place is for, and how to go on. A non-modal dialog, so
 * the highlighted element stays reachable; Escape skips the tour.
 */
export function TourStepCard({
  stepKey,
  current,
  total,
  box,
  viewport,
  missing,
  showHint,
  showNext,
  showFinish,
  onNext,
  onFinish,
  onSkip,
  onFocusTarget,
}: {
  stepKey: TourStepKey;
  current: number;
  total: number;
  box: Box | null;
  viewport: { width: number; height: number };
  missing: boolean;
  showHint: boolean;
  showNext: boolean;
  showFinish: boolean;
  onNext: () => void;
  onFinish: () => void;
  onSkip: () => void;
  onFocusTarget: () => void;
}) {
  const t = useTranslations("iaTour");
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(CARD_FALLBACK_HEIGHT);

  useEffect(() => {
    const card = cardRef.current;
    if (card === null) return;
    const observer = new ResizeObserver(() => setHeight(card.offsetHeight));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const position = placeCard(box, height, viewport);
  const arrow = arrowStyle(position.placement, position.arrowOffset);

  // Escape skips the tour wherever focus is (it usually stays on the page), except while a page dialog is open:
  // there Escape closes that dialog, and the tour carries on.
  const skipOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (document.querySelector('[aria-modal="true"]') !== null) return;
    onSkip();
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      skipOnEscape(event);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      ref={cardRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="fixed z-[72] flex flex-col gap-3 rounded-[20px] bg-background-surface p-5 shadow-modal motion-safe:transition-[top,left] motion-safe:duration-200"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      {arrow ? (
        <span
          aria-hidden
          className="absolute size-3.5 rotate-45 bg-background-surface"
          style={arrow}
        />
      ) : null}
      <div className="flex items-center justify-between">
        <p className="type-overline text-text-accent">
          {t("card.progress", { current, total })}
        </p>
        <button
          type="button"
          onClick={onSkip}
          aria-label={t("card.close")}
          className="grid size-6 place-items-center rounded-full text-text-muted hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <X aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      <div
        role="progressbar"
        aria-label={t("card.progressLabel")}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-1 overflow-hidden rounded-full bg-background-muted"
      >
        <div
          className="h-1 rounded-full bg-brand-odtu-primary"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <h2 id={titleId} className="type-h4 text-text-primary">
        {t(`steps.${stepKey}.title`)}
      </h2>
      <p id={bodyId} className="type-body-sm text-text-secondary">
        {t(`steps.${stepKey}.body`)}
      </p>
      {missing ? (
        <p className="type-caption text-text-muted">
          {t("card.missingTarget")}
        </p>
      ) : null}
      {showHint ? (
        <button
          type="button"
          onClick={onFocusTarget}
          className="flex w-full items-center gap-2 rounded-[10px] bg-brand-odtu-bg px-2.5 py-2 text-left type-label-sm text-brand-odtu-strong focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-brand-odtu-primary motion-safe:animate-pulse"
          />
          {t(`steps.${stepKey}.hint`)}
        </button>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="type-label-sm text-text-muted hover:text-text-primary hover:underline"
        >
          {t("card.skip")}
        </button>
        {showFinish ? (
          <Button size={ButtonSize.Small} onClick={onFinish}>
            {t("card.finish")}
          </Button>
        ) : showNext ? (
          <Button size={ButtonSize.Small} onClick={onNext}>
            {t("card.next")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
