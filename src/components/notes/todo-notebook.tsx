import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  TODO_NOTEBOOK_MIN_ROWS,
  TODO_NOTEBOOK_RING_GROUPS,
} from "@/lib/const/notes";

export function TodoNotebook({
  titleId,
  heading: Heading = "h2",
  className = "",
  children,
}: {
  titleId: string;
  heading?: "h2" | "h3";
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations("notes.todo");
  return (
    <section
      aria-labelledby={titleId}
      className={`relative pl-[11px] ${className}`}
    >
      <div className="h-full pr-1 pt-1 drop-shadow-[8px_-8px_0_#a8a8a8]">
        <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e4e7ea] bg-white py-6 pl-9 pr-6 shadow-[4px_-4px_0_#d4d8dd]">
          <Heading
            id={titleId}
            className="shrink-0 border-b border-[#c2c2c2] p-3 text-xl leading-7 text-[#22262b]"
          >
            {t("title")}
          </Heading>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-[81.5px] hidden flex-col gap-[19px] sm:flex"
      >
        {Array.from({ length: TODO_NOTEBOOK_RING_GROUPS }, (_, index) => (
          <Image
            key={index}
            src="/startup/notebook-binding.svg"
            alt=""
            width={36}
            height={114}
            className="-ml-[1.5px] -mt-[1.5px] h-[113.5px] w-[35.9px]"
          />
        ))}
      </div>
    </section>
  );
}

export function TodoCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className="relative grid size-[18px] shrink-0 place-items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[4px] border border-[#d4d8dd] bg-white checked:bg-[#e86f22]"
      />
      <Image
        src="/notes/todo-check.svg"
        alt=""
        width={14}
        height={14}
        className="pointer-events-none relative opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}

export function TodoBlankRows({ used }: { used: number }) {
  const count = Math.max(0, TODO_NOTEBOOK_MIN_ROWS - used);
  return Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      aria-hidden
      className="h-[43px] border-b border-[#c2c2c2]"
    />
  ));
}
