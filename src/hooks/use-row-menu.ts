"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A row's "⋯" menu: open and closed, the delete confirmation inside it, and closing on Escape or a click
 * elsewhere, with focus back on the button that opened it.
 */
export function useRowMenu() {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setConfirming(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        rootRef.current?.contains(event.target)
      ) {
        return;
      }
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return {
    rootRef,
    buttonRef,
    menu: {
      open,
      confirming,
      toggle: () => {
        setOpen((value) => !value);
        setConfirming(false);
      },
      askToConfirm: () => {
        setConfirming(true);
      },
      close: () => {
        setOpen(false);
        setConfirming(false);
      },
    },
  };
}
