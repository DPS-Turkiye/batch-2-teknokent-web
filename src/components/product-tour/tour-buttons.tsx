import type { ReactNode } from "react";

const BASE =
  "inline-flex items-center justify-center font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-odtu-primary,#d0112b)]";

const SIZES = {
  medium: "h-11 rounded-[14px] px-5 text-sm tracking-[-0.014px]",
  small: "h-9 rounded-xl px-3 text-[13px]",
} as const;

type TourButtonProps = {
  children: ReactNode;
  onClick: () => void;
  size?: keyof typeof SIZES;
};

/** The tour's red action button (design v1.1 Button / Primary). */
export function TourPrimaryButton({
  children,
  onClick,
  size = "medium",
}: TourButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE} ${SIZES[size]} bg-[var(--color-action-primary-bg,#d0112b)] text-white shadow-[0_1px_1.5px_rgba(28,32,38,0.05),0_1px_1px_rgba(28,32,38,0.04)] hover:bg-[#b00e24]`}
    >
      {children}
    </button>
  );
}

/** The tour's outlined button (design v1.1 Button / Ghost). */
export function TourGhostButton({
  children,
  onClick,
  size = "medium",
}: TourButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE} ${SIZES[size]} border border-[#dce1e6] bg-white text-[#1c2026] hover:bg-[#f6f7f9]`}
    >
      {children}
    </button>
  );
}
