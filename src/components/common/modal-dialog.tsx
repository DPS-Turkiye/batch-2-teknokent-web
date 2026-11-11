"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const DEFAULT_PANEL_CLASS =
  "w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl outline-none";

const DEFAULT_OVERLAY_CLASS =
  "fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4";

export function ModalDialog({
  children,
  labelledBy,
  onClose,
  panelClassName = DEFAULT_PANEL_CLASS,
  overlayClassName = DEFAULT_OVERLAY_CLASS,
  dismissOnBackdrop = false,
}: {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  panelClassName?: string;
  overlayClassName?: string;
  dismissOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    (dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, []);

  return (
    <div
      className={overlayClassName}
      onClick={
        dismissOnBackdrop
          ? (event) => {
              if (event.target === event.currentTarget) closeRef.current();
            }
          : undefined
      }
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={panelClassName}
      >
        {children}
      </section>
    </div>
  );
}
