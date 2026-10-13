"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

type ClientTranslator = ReturnType<typeof useTranslations<"clientErrors">>;
type ClientTextKey = Parameters<ClientTranslator>[0];

// Error texts are built in plain modules (lib/client, lib/firebase) that cannot call hooks;
// the root layout hands them the active translator so they need not bundle both message files.
let translate: ClientTranslator | null = null;

export function setClientTexts(translator: ClientTranslator | null) {
  translate = translator;
}

/** A `clientErrors` message in the active language; the key itself before the app has mounted. */
export function clientText(
  key: ClientTextKey,
  values?: Record<string, string | number>,
): string {
  return translate ? translate(key, values) : key;
}

/** True when `clientErrors` has this key, for keys built at runtime (Firebase error codes). */
export function hasClientText(key: string): key is ClientTextKey {
  return translate?.has(key as ClientTextKey) ?? false;
}

export function ClientTexts() {
  const t = useTranslations("clientErrors");
  useEffect(() => setClientTexts(t), [t]);
  return null;
}
