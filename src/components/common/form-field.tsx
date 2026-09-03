"use client";

import type { ReactNode } from "react";

/**
 * The signup wizard's field styling, shared by the wizard steps and the profile
 * editors that mirror them. Both step files had their own copy; a third and
 * fourth appeared when the editors were added.
 */
export const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e4e7ea] bg-white px-3.5 text-sm text-[#22262b] outline-none transition placeholder:text-[#a4aab2] focus:border-[#e86f22]";

export const labelClass = "mb-1.5 block text-xs font-medium text-[#3c424a]";

export const cardClass =
  "space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6";

export const cardHeadingClass = "text-sm font-semibold";

/** A labelled text input or textarea, wired up for accessible lookup. */
export function FormField({
  id,
  label,
  value,
  onChange,
  multiline,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          className={`${fieldClass} min-h-24 resize-y py-3 leading-relaxed`}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className={fieldClass}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
