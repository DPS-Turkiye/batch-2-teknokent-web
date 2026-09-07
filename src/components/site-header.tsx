import Link from "next/link";

import { Brand } from "@/components/brand";
import { SITE_NAV_ITEMS } from "@/lib/const";

function ActionLinks() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      <Link
        href="/login"
        className="border border-zinc-950 bg-zinc-950 px-4 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Giriş Yap
      </Link>
      <Link
        href="/signup"
        className="border border-zinc-400 px-4 py-2 text-center text-xs font-medium transition-colors hover:bg-zinc-100"
      >
        Kayıt Ol
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav
          aria-label="Ana menü"
          className="hidden items-center gap-5 text-[11px] lg:flex"
        >
          {SITE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-zinc-700 hover:text-black hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 sm:block">
          <ActionLinks />
        </div>

        <details className="relative lg:hidden">
          <summary className="cursor-pointer border border-zinc-400 px-3 py-2 text-xs font-medium">
            Menü
          </summary>
          <div className="absolute right-0 top-12 w-72 border border-zinc-300 bg-white p-4 shadow-lg">
            <nav aria-label="Mobil menü" className="grid gap-1 text-sm">
              {SITE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-zinc-100 px-2 py-2.5 hover:bg-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 sm:hidden">
              <ActionLinks />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
