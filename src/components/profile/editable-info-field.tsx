"use client";

import { Check, Pencil } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { EditableChips } from "@/components/common/editable-chips";
import { fieldClass, labelClass } from "@/components/common/form-field";

/**
 * Grows the textarea to fit its content instead of scrolling inside a fixed
 * box. A manual resize handle asks the user to do this by hand for every
 * field; this does it for them, and still lets them shrink it back down.
 */
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return ref;
}

const editButtonClass =
  "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#e4e7ea] bg-white px-3 text-xs font-semibold text-[#3c424a] transition hover:border-[#e86f22] hover:text-[#c85816]";

function AutoResizeTextarea({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useAutoResize(value);
  return (
    <textarea
      autoFocus
      ref={ref}
      id={id}
      rows={1}
      className={`${fieldClass} min-h-28 resize-y overflow-hidden py-3 leading-relaxed`}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** A summary-first profile field that only becomes an input on request. */
export function EditableInfoField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="rounded-xl border border-[#edf0f2] bg-[#fcfcfd] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className={labelClass} htmlFor={isEditing ? id : undefined}>
            {label}
          </label>
          {isEditing ? (
            multiline ? (
              <AutoResizeTextarea
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
              />
            ) : (
              <input
                autoFocus
                id={id}
                className={fieldClass}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
            )
          ) : (
            <p className="break-words text-sm leading-6 text-[#22262b]">
              {value.trim() || (
                <span className="text-[#a4aab2]">Belirtilmedi</span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          aria-label={`${label} alanını ${isEditing ? "düzenlemeyi bitir" : "düzenle"}`}
          className={editButtonClass}
        >
          {isEditing ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Pencil className="size-3.5" aria-hidden />
          )}
          {isEditing ? "Bitti" : "Düzenle"}
        </button>
      </div>
    </div>
  );
}

export function EditableInfoChips({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="rounded-xl border border-[#edf0f2] bg-[#fcfcfd] p-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-medium text-[#3c424a]">{label}</h3>
          {!isEditing && values.length === 0 ? (
            <p className="mt-1 text-sm text-[#a4aab2]">Belirtilmedi</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          aria-label={`${label} alanını ${isEditing ? "düzenlemeyi bitir" : "düzenle"}`}
          className={editButtonClass}
        >
          {isEditing ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Pencil className="size-3.5" aria-hidden />
          )}
          {isEditing ? "Bitti" : "Düzenle"}
        </button>
      </div>

      {isEditing ? (
        <EditableChips label={label} values={values} onChange={onChange} />
      ) : values.length ? (
        <div className="flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex min-h-8 items-center rounded-full border border-[#f2b78f] bg-[#fff9f5] px-3 text-xs font-medium text-[#c85816]"
            >
              {value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
