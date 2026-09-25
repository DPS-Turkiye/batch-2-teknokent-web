/**
 * Paints a single-colour line icon in the current text colour, so one asset
 * serves both the active (white) and idle (grey) tab states.
 */
export function MaskIcon({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden="true"
      data-icon={src}
      className="inline-block shrink-0 bg-current"
      style={{
        width: size,
        height: size,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }}
    />
  );
}
