import "react";

// Inline styles set CSS custom properties (`--ms-accent`, `--d`, ...), which React passes through as-is.
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
