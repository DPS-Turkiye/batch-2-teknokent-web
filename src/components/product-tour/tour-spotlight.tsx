"use client";

import type { CSSProperties } from "react";

import { grow, panesAround } from "@/lib/product-tour";
import type { Box } from "@/types/product-tour";

const PANE_CLASS = "fixed z-[70] bg-text-primary/55";
const HALO_GAP = 8;

function boxStyle(box: Box): CSSProperties {
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

/**
 * Dims the page around the highlighted element and catches clicks there, so only the element itself can be
 * pressed. Without an element the whole page is dimmed and the card carries on alone.
 */
export function TourSpotlight({
  box,
  radius,
  viewport,
}: {
  box: Box | null;
  radius: string | null;
  viewport: { width: number; height: number };
}) {
  if (box === null) {
    return (
      <div
        aria-hidden
        data-testid="tour-backdrop"
        className={`${PANE_CLASS} inset-0`}
      />
    );
  }
  const corner = radius ?? "12px";
  return (
    <>
      {Object.entries(panesAround(box, viewport)).map(([side, pane]) => (
        <div
          key={side}
          aria-hidden
          data-testid={`tour-pane-${side}`}
          className={PANE_CLASS}
          style={boxStyle(pane)}
        />
      ))}
      <div
        aria-hidden
        className="pointer-events-none fixed z-[71] border-[3px] border-brand-odtu-primary"
        style={{ ...boxStyle(box), borderRadius: corner }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed z-[71] border-2 border-brand-odtu-primary opacity-40 motion-safe:animate-pulse"
        style={{
          ...boxStyle(grow(box, HALO_GAP)),
          borderRadius: `calc(${corner} + ${HALO_GAP}px)`,
        }}
      />
    </>
  );
}
