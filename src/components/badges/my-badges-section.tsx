// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";

import { BadgeStatus } from "@/interfaces/badges";
import { useMyBadges } from "@/hooks/use-badges";
import { formatLongDate } from "@/lib/utils";

/**
 * Profilim › Rozetlerim: every badge the person was awarded, active ones first; expired and revoked ones greyed,
 * with the reason a badge was taken back (only the holder and staff see it). Lane S places it in Profilim.
 */
export function MyBadgesSection() {
  const t = useTranslations("badges");
  const locale = useLocale();
  const query = useMyBadges();
  const awards = [...(query.data ?? [])].sort(
    (left, right) =>
      Number(right.status === BadgeStatus.Active) -
      Number(left.status === BadgeStatus.Active),
  );

  return (
    <section aria-labelledby="my-badges-title" className="space-y-3">
      <h2
        id="my-badges-title"
        className="text-base font-semibold text-[#22262b]"
      >
        {t("mine.title")}
      </h2>
      {query.isLoading ? (
        <p role="status" className="text-sm text-[#676e78]">
          {t("mine.loading")}
        </p>
      ) : null}
      {query.error ? (
        <p role="alert" className="text-sm text-red-700">
          {t("mine.loadFailed")}
        </p>
      ) : null}
      {!query.isLoading && !query.error && awards.length === 0 ? (
        <p className="text-sm text-[#676e78]">{t("mine.empty")}</p>
      ) : null}
      <ul className="space-y-2">
        {awards.map((award) => (
          <li
            key={award.id}
            className={`rounded-2xl border border-[#e9ecef] px-4 py-3 ${
              award.status === BadgeStatus.Active ? "" : "opacity-60"
            }`}
          >
            <p className="text-sm font-semibold text-[#22262b]">
              {t(`names.${award.code}`)}
              <span className="ml-2 text-xs font-normal text-[#676e78]">
                {t(`statuses.${award.status}`)}
              </span>
            </p>
            <p className="text-xs text-[#676e78]">
              {award.programName
                ? t("mine.awardedIn", {
                    program: award.programName,
                    date: formatLongDate(award.awardedAt, locale),
                  })
                : t("mine.awardedOn", {
                    date: formatLongDate(award.awardedAt, locale),
                  })}
            </p>
            {award.status === BadgeStatus.Revoked && award.reason ? (
              <p className="mt-1 text-xs text-[#b94f12]">
                {t("mine.revokedBecause", { reason: award.reason })}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
