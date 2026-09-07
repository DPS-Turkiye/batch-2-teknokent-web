import Link from "next/link";
import { ReactNode } from "react";

export function SecondaryButton({
  children,
  href,
  target,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  target?: "_blank";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = `inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e4e7ea] bg-white px-4 text-sm font-semibold text-[#3c424a] transition hover:border-[#e86f22] hover:bg-[#fff9f5] hover:text-[#c85816] disabled:cursor-not-allowed disabled:text-[#aaa] disabled:hover:bg-white ${className}`;
  if (href && !disabled) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={styles}
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
    >
      {children}
    </button>
  );
}
