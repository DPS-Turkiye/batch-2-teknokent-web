"use client";

import Link from "next/link";

import { Brand } from "@/components/brand";
import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { SITE_FOOTER_GROUPS } from "@/lib/const";

export function SiteFooter() {
  const destination = usePublicSessionDestination();

  return (
    <footer id="yardim" className="border-t border-zinc-300 bg-zinc-100">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_2fr] lg:px-8">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-4 text-xs leading-5 text-zinc-600">
            ODTÜ Teknokent girişimlerine mentorluk, eğitim ve program yönetimi
            hizmetleri sunan dijital platform.
          </p>
          <Link
            href={destination.href}
            className="mt-6 block border border-black bg-black px-4 py-2.5 text-center text-xs font-medium text-white"
          >
            {destination.label}
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {SITE_FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2 text-xs">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} className="hover:underline">
                        {link.label}
                      </a>
                    ) : (
                      <span className="text-zinc-400">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-zinc-300">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-2 px-4 py-5 text-[10px] text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <span>© 2026 ODTÜ Teknokent. Tüm hakları saklıdır.</span>
          <span>Mentorluk ve Girişim Programları Platformu</span>
        </div>
      </div>
    </footer>
  );
}
