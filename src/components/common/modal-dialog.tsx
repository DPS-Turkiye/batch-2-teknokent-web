import type { ReactNode } from "react";

export function ModalDialog({
  children,
  labelledBy,
}: {
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        {children}
      </section>
    </div>
  );
}
