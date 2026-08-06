import Link from "next/link";

import { Brand } from "@/components/brand";

const footerGroups = [
  {
    title: "Platform",
    links: ["Mentorluk Nedir?", "Programlar", "Eğitimler", "Duyurular"],
  },
  {
    title: "Destek",
    links: ["Yardım Merkezi", "Sıkça Sorulan Sorular", "İletişim"],
  },
  {
    title: "Yasal",
    links: ["Gizlilik", "Kullanım Koşulları", "KVKK"],
  },
] as const;

export function SiteFooter() {
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
            href="/login"
            className="mt-6 block border border-black bg-black px-4 py-2.5 text-center text-xs font-medium text-white"
          >
            Giriş Yap
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2 text-xs">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:underline">
                      {link}
                    </a>
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
