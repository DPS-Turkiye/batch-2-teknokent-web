"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useMemo } from "react";

import {
  Locale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/i18n";
import { messagesFor, type Messages } from "@/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

// Without a provider (tests, isolated renders) everything reads Turkish.
const LocaleContext = createContext<LocaleContextValue>({
  locale: Locale.Tr,
  messages: messagesFor(Locale.Tr),
  setLocale: () => undefined,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages: messagesFor(locale),
      setLocale: (next) => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
        router.refresh();
      },
    }),
    [locale, router],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
