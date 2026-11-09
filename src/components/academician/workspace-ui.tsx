// TEST UI: placeholder until the design team's screen; replace when it arrives.
import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/admin/admin-ui";
import { initials } from "@/lib/utils";

/** The academician screens' building blocks, in the admin and coordinator workspaces' style. */

export function WorkspaceSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold leading-[1.3] text-[#22262b]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A list in a rounded panel; rows are WorkspaceRow. */
export function WorkspaceList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      className="rounded-3xl border border-[#e9ecef] bg-white p-2"
    >
      {children}
    </ul>
  );
}

export function WorkspaceRow({ children }: { children: ReactNode }) {
  return (
    <li className="border-b border-[#f0f2f4] px-4 py-3.5 last:border-0">
      {children}
    </li>
  );
}

/** An initials avatar with a name and one muted line under it. */
export function PersonLine({
  name,
  detail,
  tone = "blue",
}: {
  name: string;
  detail?: string | null;
  tone?: "orange" | "blue";
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar initials={initials(name)} tone={tone} size="lg" />
      <div className="min-w-0">
        <p className="break-words text-[14px] font-medium leading-[1.3] text-[#22262b] sm:truncate">
          {name}
        </p>
        {detail ? (
          <p className="mt-[3px] break-words text-[12.5px] leading-[1.3] text-[#858c96] sm:truncate">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** A labelled box inside a row, e.g. the requested times or a note. */
export function DetailBox({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-[18px] border border-[#e4e7ea] px-4 py-3.5">
      <p className="text-[11.5px] font-medium text-[#858c96]">{label}</p>
      <div className="mt-2 text-[13px] leading-[1.45] text-[#22262b]">
        {children}
      </div>
    </div>
  );
}

/** A count with a title and a link, like the cards at the top of the admin home. */
export function StatCard({
  value,
  title,
  hint,
  href,
  linkLabel,
  highlight = false,
}: {
  value: number;
  title: string;
  hint: string;
  href: string;
  linkLabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[141px] flex-col gap-3 rounded-3xl border bg-white px-5 py-4 ${
        highlight ? "border-[#26a4ff]" : "border-[#e9ecef]"
      }`}
    >
      <p className="text-[22px] font-semibold leading-none text-[#22262b]">
        {value}
      </p>
      <div>
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#858c96]">{hint}</p>
      </div>
      <Link
        href={href}
        className="mt-auto text-[13px] font-medium text-[#22262b]"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

/** A one-line dashed placeholder for an empty list inside a section. */
export function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-[#d6dade] bg-white px-5 py-6 text-center text-[13px] text-[#676e78]">
      {text}
    </p>
  );
}

export const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#e9ecef] bg-white px-3.5 py-2.5 text-[13.5px] text-[#22262b] outline-none placeholder:text-[#aeb4bc] focus:border-[#22262b]";

export const labelClass = "text-[12.5px] font-medium text-[#676e78]";
