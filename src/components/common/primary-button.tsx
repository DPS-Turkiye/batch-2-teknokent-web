import Link from "next/link";
import type { ReactNode } from "react";

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className = "",
  type = "button",
  describedBy,
}: {
  children: ReactNode;
  href?: string | undefined;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  /** Id of the text that says why the button is disabled. */
  describedBy?: string | undefined;
}) {
  const styles = `inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--ms-accent,#e86f22)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--ms-accent-hover,#ce5e19)] disabled:cursor-not-allowed disabled:bg-[#c9cdd2] ${className}`;
  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-describedby={describedBy}
      className={styles}
    >
      {children}
    </button>
  );
}
