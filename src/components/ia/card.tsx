import type { ReactNode } from "react";

/**
 * A design-system card: radius 24, default border, white surface. `featured` uses the theme's tinted card (ODTÜ
 * pink in the student theme). `padding` follows the Figma frames: 24 px for content cards, 20 px for compact ones.
 */
export function Card({
  children,
  featured = false,
  compact = false,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  featured?: boolean;
  compact?: boolean;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`rounded-card border ${
        featured
          ? "border-card-featured-border bg-card-featured-bg"
          : "border-border-default bg-background-surface"
      } ${compact ? "p-5" : "p-6"} ${className}`}
    >
      {children}
    </section>
  );
}
