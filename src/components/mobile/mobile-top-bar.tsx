import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Back button, centred title and an optional action, for screens outside the tab bar. */
export function MobileTopBar({
  title,
  backHref,
  backLabel = "Geri",
  action,
  tone = "grey",
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  action?: ReactNode;
  tone?: "grey" | "white";
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-inherit px-4 pt-[calc(4px+env(safe-area-inset-top))] pb-2">
      <Link
        href={backHref}
        aria-label={backLabel}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          tone === "white" ? "bg-white" : "bg-[#f5f6f8]"
        }`}
      >
        <Image src="/mobile/icon-back.svg" alt="" width={22} height={22} />
      </Link>
      <h1 className="min-w-0 flex-1 text-center text-[17px] leading-[1.35] font-semibold text-[#22262b]">
        {title}
      </h1>
      <div className="flex min-w-11 shrink-0 justify-end">{action}</div>
    </header>
  );
}
