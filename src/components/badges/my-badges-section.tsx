// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { BadgeCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Panel } from "@/components/admin/admin-ui";
import { AchievementProgressList } from "@/components/badges/achievement-progress-list";
import { Badge } from "@/components/common/badge";
import { useMyBadges } from "@/hooks/use-badges";
import { BadgeKind, BadgeStatus } from "@/interfaces/badges";
import { formatLongDate } from "@/lib/utils";

/**
 * Profilim › Rozetlerim: the gate badge with every status, active first; expired and revoked ones greyed, with
 * the reason a badge was taken back (only the holder and staff see it). Achievements follow with their progress;
 * one that was taken back stays in the first list. Lane S places it in Profilim.
 */
export function MyBadgesSection() {
  const t = useTranslations("badges");
  const locale = useLocale();
  const query = useMyBadges();
  const all = query.data ?? [];
  const awards = all
    .filter(
      (award) =>
        award.kind === BadgeKind.Gate || award.status !== BadgeStatus.Active,
    )
    .sort(
      (left, right) =>
        Number(right.status === BadgeStatus.Active) -
        Number(left.status === BadgeStatus.Active),
    );

  return (
    <section aria-labelledby="my-badges-title" className="space-y-5">
      <h2
        id="my-badges-title"
        className="text-[18px] font-semibold text-[#22262b]"
      >
        {t("mine.title")}
      </h2>
      {query.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("mine.loading")}
        </p>
      ) : null}
      {query.error ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {t("mine.loadFailed")}
        </p>
      ) : null}
      {!query.isLoading && !query.error && all.length === 0 ? (
        <p className="text-sm text-[#858c96]">{t("mine.empty")}</p>
      ) : null}
      {awards.length > 0 ? (
        <Panel>
          <ul className="divide-y divide-[#eef0f2]">
            {awards.map((award) => {
              const active = award.status === BadgeStatus.Active;
              return (
                <li
                  key={award.id}
                  className={`flex gap-3 p-5 ${active ? "" : "opacity-60"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      active
                        ? "bg-[#f0fdf4] text-[#008236]"
                        : "bg-[#f4f5f6] text-[#a3a9b1]"
                    }`}
                  >
                    <BadgeCheck className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#22262b]">
                        {t(`names.${award.code}`)}
                      </p>
                      <Badge tone={active ? "green" : "gray"}>
                        {t(`statuses.${award.status}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#858c96]">
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
                      <p className="text-xs text-[#b94f12]">
                        {t("mine.revokedBecause", { reason: award.reason })}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}
      <AchievementProgressList />
    </section>
  );
}
