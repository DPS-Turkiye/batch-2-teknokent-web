"use client";

import { Check } from "lucide-react";

export function ChipGroup({
  options,
  selected,
  onToggle,
  label,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option)}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
              isSelected
                ? "border-[#e86f22] bg-[#fff9f5] text-[#c85816]"
                : "border-[#e4e7ea] bg-white text-[#676e78] hover:border-[#f2b78f] hover:text-[#22262b]"
            }`}
          >
            {isSelected ? <Check className="size-3.5" aria-hidden /> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}
