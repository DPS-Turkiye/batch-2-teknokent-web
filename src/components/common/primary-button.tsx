import Link from "next/link";
import { ReactNode } from "react";

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = `inline-flex min-h-9 items-center justify-center rounded-md bg-[#555] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#3f3f3f] disabled:cursor-not-allowed disabled:bg-[#aaa] ${className}`;
  if (href) {
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
