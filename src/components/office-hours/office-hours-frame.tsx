import type { ReactNode } from "react";

/**
 * The plain frame office hours open in from Moodle: the Menton name, who is signed in, and the page. No Menton
 * navigation, since an office-hours session opens these pages only.
 */
export function OfficeHoursFrame({
  productName,
  userName,
  children,
}: {
  productName: string;
  userName?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#22262b]">
      <header className="border-b border-[#e4e7ea] bg-white">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-4 sm:px-6">
          <p className="text-lg font-semibold tracking-tight">
            menton{" "}
            <span className="font-normal text-[#676e78]">· {productName}</span>
          </p>
          {userName ? (
            <p className="text-sm text-[#4a5059]">{userName}</p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
