import Link from "next/link";
import { ReactNode } from "react";

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = `inline-flex min-h-10 items-center justify-center rounded-lg bg-[#e86f22] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2] ${className}`;
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
      className={styles}
    >
      {children}
    </button>
  );
}
