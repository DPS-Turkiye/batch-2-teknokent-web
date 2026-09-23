import type { ReactNode } from "react";

export function ProfileCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
