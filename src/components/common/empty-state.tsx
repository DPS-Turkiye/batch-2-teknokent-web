import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const ACCENTS = {
  orange: "text-[#e86f22]",
  blue: "text-[#26a4ff]",
} as const;

export type EmptyStateAccent = keyof typeof ACCENTS;

/** The dashed "nothing here yet" card: an icon, a title, and an optional line and action. */
export function EmptyState({
  title,
  body,
  action,
  accent = "orange",
  className = "mt-5",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  accent?: EmptyStateAccent;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-dashed border-[#d6dade] bg-white p-12 text-center ${className}`}
    >
      <Sparkles aria-hidden className={`mx-auto size-7 ${ACCENTS[accent]}`} />
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {body ? <p className="mt-1 text-sm text-[#676e78]">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
