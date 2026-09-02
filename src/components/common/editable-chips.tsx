"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

/**
 * A free-form set of chips: values come from anywhere — a parsed CV, the user's
 * own typing — rather than a fixed option list.
 *
 * Distinct from ChipGroup, which toggles membership of a known list. A parsed CV
 * returns whatever the document actually says, so there is no list to toggle
 * against, and mapping those values onto a fixed set would discard most of them.
 */
export function EditableChips({
  label,
  values,
  onChange,
  placeholder = "Ekle…",
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  }

  function remove(value: string) {
    onChange(values.filter((entry) => entry !== value));
  }

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap items-center gap-2"
      >
        {values.length === 0 ? (
          <p className="text-xs text-[#858c96]">
            Henüz bir alan eklenmedi. CV yükleyerek otomatik doldurabilir veya
            elle ekleyebilirsin.
          </p>
        ) : null}
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#e86f22] bg-[#fff9f5] px-3 text-xs font-medium text-[#c85816]"
          >
            {value}
            <button
              type="button"
              onClick={() => remove(value)}
              aria-label={`${value} alanını kaldır`}
              className="grid size-4 place-items-center rounded-full text-[#c85816] transition hover:bg-[#f7d9c4]"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2">
        <input
          aria-label={`${label} ekle`}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // Enter must not submit the wizard step.
              event.preventDefault();
              add();
            }
          }}
          className="min-h-9 flex-1 rounded-lg border border-[#e4e7ea] bg-white px-3 text-xs text-[#22262b] outline-none transition placeholder:text-[#a4aab2] focus:border-[#e86f22]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#e4e7ea] px-3 text-xs font-semibold text-[#3c424a] transition hover:border-[#f2b78f] disabled:opacity-50"
        >
          <Plus className="size-3.5" aria-hidden />
          Ekle
        </button>
      </div>
    </div>
  );
}
