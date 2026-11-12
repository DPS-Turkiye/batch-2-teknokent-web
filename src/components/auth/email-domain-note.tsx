"use client";

import { useTranslations } from "next-intl";

/** Under the sign-up e-mail field on a deployment that limits sign-up to some domains. */
export function EmailDomainNote({
  domains,
  notAllowed,
}: {
  domains: string;
  notAllowed: boolean;
}) {
  const t = useTranslations("auth");
  if (!domains) return null;
  return notAllowed ? (
    <p role="alert" className="mt-1.5 text-xs text-[#c0392b]">
      {t("emailDomainNotAllowed", { domains })}
    </p>
  ) : (
    <p className="mt-1.5 text-xs text-[#676e78]">
      {t("emailDomainHint", { domains })}
    </p>
  );
}
