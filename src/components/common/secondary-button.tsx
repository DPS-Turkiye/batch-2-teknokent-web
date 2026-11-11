import Link from "next/link";
import type { ReactNode } from "react";

export function SecondaryButton({
  children,
  href,
  target,
  onClick,
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  href?: string;
  target?: "_blank";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const styles = `inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e4e7ea] bg-white px-4 text-sm font-semibold text-[#3c424a] transition hover:border-[var(--ms-accent,#e86f22)] hover:bg-[var(--ms-accent-faint,#fff9f5)] hover:text-[var(--ms-accent-strong,#c85816)] disabled:cursor-not-allowed disabled:text-[#aaa] disabled:hover:bg-white ${className}`;
  if (href && !disabled) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={styles}
        title={title}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles}
      title={title}
    >
      {children}
    </button>
  );
}
