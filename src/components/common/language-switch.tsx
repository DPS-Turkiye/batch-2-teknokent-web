"use client";

import { useTranslations } from "next-intl";

import { useLanguageSwitch } from "@/hooks/use-language-switch";
import { ENGLISH_ENABLED, Locale } from "@/lib/i18n";

const LOCALES = [Locale.Tr, Locale.En] as const;

/** Türkçe / English; hidden until English is switched on for this environment. */
export function LanguageSwitch({
  enabled = ENGLISH_ENABLED,
}: {
  enabled?: boolean;
}) {
  return enabled ? <LanguageButtons /> : null;
}

function LanguageButtons() {
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
          onClick={() => setLocale(option)}
          className={`rounded-full px-3 py-1 ${
            locale === option ? "bg-[#22262b] text-white!" : "text-[#676e78]!"
          }`}
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
