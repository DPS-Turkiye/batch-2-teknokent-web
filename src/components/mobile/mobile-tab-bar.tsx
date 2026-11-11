import { useTranslations } from "next-intl";
import Link from "next/link";

import { MaskIcon } from "@/components/mobile/mask-icon";
import type { MobileTab, MobileTabLink } from "@/interfaces/mobile";

export function MobileTabBar({
  tabs,
  activeTab,
  badges = {},
}: {
  tabs: MobileTabLink[];
  activeTab?: MobileTab | undefined;
  badges?: Partial<Record<MobileTab, number>>;
}) {
  const t = useTranslations("mobile.shell");
  return (
    <nav
      aria-label={t("mainMenu")}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] drop-shadow-[0px_7px_14.5px_rgba(100,100,111,0.2)]"
    >
      <ul className="flex rounded-[30px] bg-white p-2">
        {tabs.map((link) => {
          const active = link.tab === activeTab;
          const badge = badges[link.tab] ?? 0;
          return (
            <li key={link.tab} className="flex min-w-0 flex-1">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[45px] py-1 text-[11.5px] leading-[1.35] ${
                  active
                    ? "bg-[var(--mobile-accent)] font-semibold text-white"
                    : "font-medium text-[#858c96]"
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <MaskIcon src={link.icon} size={22} />
                  {badge > 0 ? (
                    <span className="absolute top-[-2px] left-[34px] rounded-full bg-[var(--mobile-accent)] px-[5px] py-px text-[10px] leading-[1.35] font-semibold text-white">
                      {badge}
                    </span>
                  ) : null}
                </span>
                {t(`tabs.${link.tab}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
