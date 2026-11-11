import { initials } from "@/lib/utils";

/** A student's initials in the ODTÜ tint, as on every academician list and card. */
export function StudentAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-odtu-bg type-label text-brand-odtu-strong"
    >
      {initials(name)}
    </span>
  );
}
