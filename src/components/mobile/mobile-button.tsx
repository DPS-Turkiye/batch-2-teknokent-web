import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { MobileButtonVariant } from "@/interfaces/mobile";

const BASE_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-full px-[22px] py-[15px] text-[15px] font-semibold leading-[1.35] transition-colors disabled:bg-[#eef0f2] disabled:text-[#aeb4bc]";

const VARIANT_CLASS: Record<MobileButtonVariant, string> = {
  [MobileButtonVariant.Neutral]: "bg-[#22262b] text-white",
  // The accent comes from the role frame (orange for mentees, blue for mentors).
  [MobileButtonVariant.Primary]: "bg-[var(--mobile-accent)] text-white",
  [MobileButtonVariant.Secondary]:
    "border border-[#e9ecef] bg-white text-[#22262b]",
  [MobileButtonVariant.Ghost]: "text-[#22262b]",
};

export function mobileButtonClass(
  variant: MobileButtonVariant = MobileButtonVariant.Neutral,
) {
  return `${BASE_CLASS} ${VARIANT_CLASS[variant]}`;
}

export function MobileButton({
  variant,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: MobileButtonVariant;
}) {
  return (
    <button
      type={type}
      className={`${mobileButtonClass(variant)} ${className}`}
      {...props}
    />
  );
}

export function MobileButtonLink({
  href,
  variant,
  children,
  external = false,
}: {
  href: string;
  variant?: MobileButtonVariant;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      className={mobileButtonClass(variant)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </Link>
  );
}
