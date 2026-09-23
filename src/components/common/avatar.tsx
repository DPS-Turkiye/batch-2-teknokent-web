/** A person's photo when they have one, otherwise their initials; `className` sets size and text. */
export function PhotoAvatar({
  initials,
  photoUrl,
  className,
  label,
  decorative = false,
}: {
  initials: string;
  photoUrl: string | null;
  className: string;
  label?: string;
  /** Beside a visible or labelled name, the photo adds nothing to announce. */
  decorative?: boolean;
}) {
  if (photoUrl) {
    return (
      <span
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : (label ?? "Profil fotoğrafı")}
        aria-hidden={decorative || undefined}
        className={`block shrink-0 rounded-full bg-[#fbe2d0] bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url("${photoUrl}")` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-[#fbe2d0] font-semibold text-[#c95c18] ${className}`}
    >
      {initials}
    </span>
  );
}

export function Avatar({
  initials,
  tone = "gray",
  size = "md",
}: {
  initials: string;
  tone?: "gray" | "purple" | "teal" | "orange" | "blue";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    gray: "bg-[#eeeeee] text-[#555]",
    purple: "bg-[#f3e8ff] text-[#8200db]",
    teal: "bg-[#cbfbf1] text-[#00786f]",
    orange: "bg-[#fdebdd] text-[#c85816]",
    blue: "bg-[#e6f1f8] text-[#1a8ad9]",
  };
  const sizes = {
    sm: "size-7 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tones[tone]} ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}
