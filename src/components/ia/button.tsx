import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

export enum ButtonVariant {
  /** The one main action of a screen; red in the ODTÜ theme, ink elsewhere. */
  Primary = "primary",
  /** A tinted fill without a border. */
  Secondary = "secondary",
  /** Text only. */
  Tertiary = "tertiary",
  /** A neutral outline ("Vazgeç", "Geri"). */
  Ghost = "ghost",
  Destructive = "destructive",
}

export enum ButtonSize {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]:
    "bg-action-primary-bg text-action-primary-fg shadow-raised hover:opacity-90",
  [ButtonVariant.Secondary]:
    "bg-action-secondary-bg text-action-secondary-fg hover:brightness-95",
  [ButtonVariant.Tertiary]: "text-text-primary hover:bg-background-subtle",
  [ButtonVariant.Ghost]:
    "border border-border-default bg-background-surface text-text-primary hover:bg-background-subtle",
  [ButtonVariant.Destructive]:
    "bg-action-destructive-bg text-text-inverse shadow-raised hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  [ButtonSize.Small]: "h-9 gap-1.5 rounded-button-sm px-3 type-button-sm",
  [ButtonSize.Medium]: "h-11 gap-2 rounded-button px-5 type-button",
  [ButtonSize.Large]: "h-[52px] gap-2 rounded-button-lg px-6 type-button-lg",
};

/** The class list of a design-system button, for the rare element that cannot be a `Button` (a label, a summary). */
export function buttonClasses(
  variant: ButtonVariant = ButtonVariant.Primary,
  size: ButtonSize = ButtonSize.Medium,
  fullWidth = false,
): string {
  return `inline-flex shrink-0 items-center justify-center whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-selected disabled:cursor-not-allowed disabled:bg-background-disabled disabled:text-text-disabled disabled:shadow-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""}`;
}

/**
 * The design system's button (Figma "Button", v1.1): S/M/L at 36/44/52 px with radius 12/14/16. With `href` it
 * renders a link that looks the same; a disabled one stays a button, so it cannot be followed.
 */
export function Button({
  children,
  variant = ButtonVariant.Primary,
  size = ButtonSize.Medium,
  href,
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
  className = "",
}: {
  children: ReactNode;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  href?: string | undefined;
  type?: "button" | "submit" | undefined;
  onClick?: MouseEventHandler<HTMLElement> | undefined;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
}) {
  const classes = `${buttonClasses(variant, size, fullWidth)} ${className}`;
  if (href !== undefined && !disabled) {
    return (
      <Link href={href} className={classes} {...(onClick ? { onClick } : {})}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
