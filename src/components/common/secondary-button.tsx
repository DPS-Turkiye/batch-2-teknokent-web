import Link from "next/link";
import { ReactNode } from "react";

export function SecondaryButton({
  children,
  href,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = `inline-flex min-h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#555] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:text-[#aaa] disabled:hover:bg-white ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
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
    >
      {children}
    </button>
  );
}
