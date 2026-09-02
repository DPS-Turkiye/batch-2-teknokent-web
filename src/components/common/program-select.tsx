"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export type ProgramSelectOption = {
  id: string;
  name: string;
  /** Secondary line, e.g. the coordinator who runs the program. */
  hint?: string;
};

type ProgramSelectProps = {
  label: string;
  options: ProgramSelectOption[];
  value: string | null;
  onChange: (programId: string | null) => void;
  noProgramLabel: string;
  disabled?: boolean;
  id?: string;
};

/**
 * Shared by the signup step and the dashboard: both pick one program from a
 * list, or none. "No program" is a real option rather than an empty first entry,
 * so choosing it is as explicit as choosing a program.
 */
export function ProgramSelect({
  label,
  options,
  value,
  onChange,
  noProgramLabel,
  disabled = false,
  id,
}: ProgramSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value) ?? null;

  function choose(programId: string | null) {
    setOpen(false);
    if (programId !== value) onChange(programId);
  }

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#e4e7ea] bg-white px-4 text-sm font-medium text-[#22262b] transition hover:border-[#f2b78f] disabled:opacity-60"
      >
        <span className={selected ? "" : "text-[#6a7282]"}>
          {selected ? selected.name : noProgramLabel}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#676e78] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="absolute left-0 right-0 top-[52px] z-20 origin-top overflow-hidden rounded-xl border border-[#e4e7ea] bg-white p-1 shadow-xl transition duration-200"
      >
        {[null, ...options.map((option) => option.id)].map((optionId) => {
          const option = options.find((entry) => entry.id === optionId) ?? null;
          const isSelected = optionId === value;
          return (
            <button
              key={optionId ?? "none"}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => choose(optionId)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                isSelected
                  ? "bg-[#fdebdd] text-[#c85816]"
                  : "text-[#3c424a] hover:bg-[#f8f9fa]"
              }`}
            >
              <span>
                {option ? option.name : noProgramLabel}
                {option?.hint ? (
                  <span className="block text-xs text-[#858c96]">
                    {option.hint}
                  </span>
                ) : null}
              </span>
              {isSelected ? <Check className="size-4 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
