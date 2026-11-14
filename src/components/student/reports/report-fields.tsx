import Image from "next/image";
import { useRef, type KeyboardEvent, type ReactNode } from "react";

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

/**
 * Multi-select chips ("Görüşme konusu", "Kullandığın beceriler"), each a checkbox for screen readers. Read-only chips
 * stay focusable (aria-disabled), so a sent report's choices can still be reached by keyboard.
 */
export function ChipToggleGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  readOnly = false,
}: {
  legend: string;
  options: readonly { id: T; label: string }[];
  selected: readonly T[];
  onToggle: (id: T) => void;
  readOnly?: boolean;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
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
              } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                aria-disabled={readOnly}
                onChange={() => {
                  if (!readOnly) onToggle(option.id);
                }}
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

export enum ChoiceLook {
  /** The IA kit's segmented control ("İlk görüşme / Takip görüşmesi", "Hayır / Evet"). */
  Segmented = "segmented",
  /** Square buttons in a row (the 1–5 productivity scale). */
  Scale = "scale",
}

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * A one-of choice that need not be made yet, as an ARIA radio group: one tab stop (the chosen option, else the
 * first), arrow keys move and choose, Home/End jump. Read-only, it stays focusable but does not change.
 */
export function ChoiceGroup<T extends string>({
  label,
  labelledBy,
  options,
  selected,
  onSelect,
  readOnly = false,
  look = ChoiceLook.Segmented,
}: {
  label?: string;
  labelledBy?: string;
  options: readonly { id: T; label: string }[];
  selected: T | null;
  onSelect: (id: T) => void;
  readOnly?: boolean;
  look?: ChoiceLook;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.id === selected);
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  function move(event: KeyboardEvent, index: number) {
    let target: number | null = null;
    if (NEXT_KEYS.has(event.key)) target = (index + 1) % options.length;
    if (PREVIOUS_KEYS.has(event.key))
      target = (index - 1 + options.length) % options.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = options.length - 1;
    const option = target === null ? undefined : options[target];
    if (target === null || option === undefined) return;
    event.preventDefault();
    buttons.current[target]?.focus();
    if (!readOnly) onSelect(option.id);
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-readonly={readOnly}
      className={
        look === ChoiceLook.Segmented
          ? "inline-flex w-fit gap-1 rounded-[14px] bg-background-muted p-1"
          : "flex flex-wrap gap-2"
      }
    >
      {options.map((option, index) => {
        const active = option.id === selected;
        return (
          <button
            key={option.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => {
              if (!readOnly) onSelect(option.id);
            }}
            onKeyDown={(event) => move(event, index)}
            className={`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-selected ${
              look === ChoiceLook.Segmented
                ? `h-9 rounded-full px-4 type-label ${
                    active
                      ? "bg-background-surface text-text-accent shadow-raised"
                      : "text-text-secondary"
                  }`
                : `size-11 rounded-button border type-label ${
                    active
                      ? "border-action-primary-bg bg-action-primary-bg text-action-primary-fg"
                      : "border-border-default bg-background-surface text-text-primary"
                  }`
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
