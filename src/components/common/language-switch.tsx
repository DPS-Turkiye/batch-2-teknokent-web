"use client";

import { useTranslations } from "next-intl";

import { useLanguageSwitch } from "@/hooks/use-language-switch";
import { ENGLISH_ENABLED, Locale } from "@/lib/i18n";

const LOCALES = [Locale.Tr, Locale.En] as const;

/**
 * Türkçe / English; hidden until English is switched on for this environment. `shortOnPhones` shows TR / EN on a
 * phone's width, for a bar with no room for the names.
 */
export function LanguageSwitch({
  enabled = ENGLISH_ENABLED,
  shortOnPhones = false,
}: {
  enabled?: boolean;
  shortOnPhones?: boolean;
}) {
  return enabled ? <LanguageButtons shortOnPhones={shortOnPhones} /> : null;
}

function LanguageButtons({ shortOnPhones }: { shortOnPhones: boolean }) {
  const t = useTranslations("language");
  const { locale, setLocale } = useLanguageSwitch();
  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex rounded-full border border-[#e4e7ea] p-0.5 text-xs font-medium"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          aria-label={t(option)}
          onClick={() => setLocale(option)}
          className={`rounded-full py-1 ${shortOnPhones ? "px-2 sm:px-3" : "px-3"} ${
            locale === option ? "bg-[#22262b] text-white!" : "text-[#676e78]!"
          }`}
        >
          {shortOnPhones ? (
            <>
              <span className="uppercase sm:hidden" lang="en">
                {option}
              </span>
              <span className="max-sm:hidden">{t(option)}</span>
            </>
          ) : (
            t(option)
          )}
        </button>
      ))}
    </div>
  );
}
