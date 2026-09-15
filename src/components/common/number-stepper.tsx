"use client";

import { Minus, Plus } from "lucide-react";

const stepButtonClass =
  "grid size-5 shrink-0 place-items-center rounded-full bg-[#26a4ff] text-white disabled:bg-[#c9cdd2]";

/** A number field with − / + buttons; the value stays a string so it can be emptied while typing. */
export function NumberStepper({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  onStep,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: string) => void;
  onStep: (direction: 1 | -1) => void;
}) {
  const filled = value.trim() !== "";
  const number = Number(value);

  return (
    <div className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d4d8dd] px-2">
      <button
        type="button"
        aria-label={`${label} azalt`}
        onClick={() => onStep(-1)}
        disabled={filled && number <= min}
        className={stepButtonClass}
      >
        <Minus className="size-3" strokeWidth={2.5} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-9 bg-transparent text-center text-xs text-[#22262b] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {unit ? <span className="text-xs text-[#4a5059]">{unit}</span> : null}
      <button
        type="button"
        aria-label={`${label} artır`}
        onClick={() => onStep(1)}
        disabled={filled && number >= max}
        className={stepButtonClass}
      >
        <Plus className="size-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}
