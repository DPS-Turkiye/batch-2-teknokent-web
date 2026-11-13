import Image from "next/image";
import type { ReactNode } from "react";

import { ISKUR_FIELD_CLASS } from "@/components/student/iskur-ui";

/** A required field's label, with the Figma's red asterisk. */
export function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="type-label text-text-primary">
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-1 text-text-accent">
          *
        </span>
      ) : null}
    </label>
  );
}

/** A labelled multi-line answer, as the report forms ask them. */
export function TextAreaField({
  id,
  label,
  value,
  onChange,
  maxLength,
  required = false,
  readOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        className={`${ISKUR_FIELD_CLASS} min-h-24`}
        value={value}
        maxLength={maxLength}
        aria-required={required}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Multi-select chips ("Görüşme konusu", "Kullandığın beceriler"), each a checkbox for screen readers. */
export function ChipToggleGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  disabled = false,
}: {
  legend: string;
  options: readonly { id: T; label: string }[];
  selected: readonly T[];
  onToggle: (id: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3" disabled={disabled}>
      <legend className="mb-3 type-label text-text-primary">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 type-label has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
                checked
                  ? "border-border-selected bg-background-selected text-text-accent"
                  : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(option.id)}
              />
              {checked ? (
                <Image
                  src="/ia/profile/chip-check.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              ) : null}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * A one-of choice drawn like the IA kit's segmented control ("İlk görüşme / Takip görüşmesi", "Hayır / Evet"), but a
 * radio group: unlike the kit's `Segmented`, nothing needs to be chosen yet.
 */
export function ChoiceGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  selected: T | null;
  onSelect: (id: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex w-fit gap-1 rounded-[14px] bg-background-muted p-1"
    >
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className={`h-9 rounded-full px-4 type-label focus-visible:outline-2 focus-visible:outline-border-selected ${
              active
                ? "bg-background-surface text-text-accent shadow-raised"
                : "text-text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
