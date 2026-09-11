import type { ButtonHTMLAttributes } from "react";

export function DangerButton({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`rounded-lg bg-[#c24135] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
