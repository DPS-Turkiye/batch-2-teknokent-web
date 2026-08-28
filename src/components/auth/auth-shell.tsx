import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export function AuthHeader() {
  return (
    <header className="border-b border-[#dee2e6] bg-white">
      <div className="mx-auto flex h-[60px] max-w-[1376px] items-center px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="metual ana sayfa"
        >
          <span className="grid size-[35px] place-items-center rounded-lg bg-[#e5701d]">
            <span className="block h-[18px] w-[3px] rounded-sm bg-white" />
          </span>
          <span className="text-[28px] font-black leading-none tracking-[-0.06em] text-[#e5701d]">
            metual
          </span>
        </Link>
      </div>
    </header>
  );
}

/** Full-width page in the auth visual language, for steps without artwork. */
export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <AuthHeader />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[1180px] items-center justify-center gap-[113px]">
          <div className="w-full max-w-[480px] px-2 sm:px-6">{children}</div>
          <div className="hidden w-[531px] shrink-0 lg:block">
            <Image
              src="/auth-illustration.webp"
              alt="METUal ile doğru mentörle eşleş"
              width={1100}
              height={923}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
