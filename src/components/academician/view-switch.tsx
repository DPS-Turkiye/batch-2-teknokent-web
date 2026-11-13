import { useTranslations } from "next-intl";
import { useRef, type KeyboardEvent } from "react";

import { AppointmentsCalendarView } from "@/types/academician-calendar";

const VIEWS = Object.values(AppointmentsCalendarView);

const ARROW_STEP: Partial<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/** "Gün | Hafta | Ay": a radio group, so the arrow keys move between the three views. */
export function ViewSwitch({
  value,
  onChange,
}: {
  value: AppointmentsCalendarView;
  onChange: (view: AppointmentsCalendarView) => void;
}) {
  const t = useTranslations("iaAcademician.appointments");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (event: KeyboardEvent, index: number) => {
    const step = ARROW_STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = (index + step + VIEWS.length) % VIEWS.length;
    const view = VIEWS[next];
    if (view === undefined) return;
    onChange(view);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("viewsLabel")}
      className="inline-flex rounded-xl bg-background-muted p-1"
    >
      {VIEWS.map((view, index) => {
        const checked = view === value;
        return (
          <button
            key={view}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => {
              onChange(view);
            }}
            onKeyDown={(event) => {
              move(event, index);
            }}
            className={`h-8 rounded-lg px-4 type-label transition focus-visible:outline-2 focus-visible:outline-border-selected ${
              checked
                ? "bg-background-surface text-brand-odtu-strong shadow-raised"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t(`views.${view}`)}
          </button>
        );
      })}
    </div>
  );
}
