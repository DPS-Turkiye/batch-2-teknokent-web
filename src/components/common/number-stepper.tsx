"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

const stepButtonClass =
  "grid size-[18px] shrink-0 place-items-center rounded-full disabled:opacity-40";

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
  unit?: string | undefined;
  onChange: (value: string) => void;
  onStep: (direction: 1 | -1) => void;
}) {
  const t = useTranslations("sharedUi");
  const filled = value.trim() !== "";
  const number = Number(value);

  return (
    <div className="flex h-[38px] w-[120px] shrink-0 items-center justify-between rounded-lg border border-[#d4d8dd] bg-white px-3">
      <button
        type="button"
        aria-label={t("decrease", { label })}
        onClick={() => onStep(-1)}
        disabled={filled ? number <= min : false}
        className={stepButtonClass}
      >
        <Image src="/mentor-profile/remove.svg" alt="" width={18} height={18} />
      </button>
      <span className="flex items-center justify-center gap-1 text-[12.5px] font-medium leading-[19px] text-[#22262b]">
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-[3ch] bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${unit ? "text-right" : "text-center"}`}
        />
        {unit ? <span>{unit}</span> : null}
      </span>
      <button
        type="button"
        aria-label={t("increase", { label })}
        onClick={() => onStep(1)}
        disabled={filled ? number >= max : false}
        className={stepButtonClass}
      >
        <Image src="/mentor-profile/add.svg" alt="" width={18} height={18} />
      </button>
    </div>
  );
}
