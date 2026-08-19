export function Avatar({
  initials,
  tone = "gray",
  size = "md",
}: {
  initials: string;
  tone?: "gray" | "purple" | "teal";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    gray: "bg-[#eeeeee] text-[#555]",
    purple: "bg-[#f3e8ff] text-[#8200db]",
    teal: "bg-[#cbfbf1] text-[#00786f]",
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
