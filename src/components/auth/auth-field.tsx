"use client";

import { type InputHTMLAttributes, type ReactNode } from "react";

export const authFieldClass =
  "h-11 w-full rounded-[10px] border border-[#e8eaed] bg-white px-3.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#e5701d]";

export function AuthField({
  id,
  label,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  value,
  onChange,
  action,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold leading-[19.5px] text-[#374151]"
        >
          {label}
          {required ? <span className="text-[#e5701d]"> *</span> : null}
        </label>
        {action}
      </div>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={authFieldClass}
      />
    </div>
  );
}
