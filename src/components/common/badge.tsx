import { ReactNode } from "react";

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "amber" | "purple";
}) {
  const tones = {
    gray: "bg-[#fdebdd] text-[#b94f12]",
    green: "bg-[#f0fdf4] text-[#008236]",
    amber: "bg-[#fffbeb] text-[#bb4d00]",
    purple: "bg-[#fdebdd] text-[#b94f12]",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
