export enum Locale {
  Tr = "tr",
  En = "en",
}

export const LOCALE_COOKIE = "menton_locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// English stays off until the main screens are translated, so no one sees half-Turkish pages.
export const ENGLISH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ENGLISH === "true";

export function isLocale(value: unknown): value is Locale {
  return value === Locale.Tr || value === Locale.En;
}

/** The saved choice wins, then the browser's first language we support; Turkish otherwise. */
export function resolveLocale(
  saved: string | null | undefined,
  acceptLanguage: string | null | undefined,
  englishEnabled = ENGLISH_ENABLED,
): Locale {
  if (!englishEnabled) return Locale.Tr;
  if (isLocale(saved)) return saved;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale);
  return preferred ?? Locale.Tr;
}
