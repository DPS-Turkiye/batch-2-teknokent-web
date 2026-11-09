// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import {
  CalendarCheck,
  Clock,
  MessageSquareText,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Panel } from "@/components/admin/admin-ui";
import { Badge } from "@/components/common/badge";
import { useMyAchievements } from "@/hooks/use-badges";
import {
  BadgeCode,
  type AchievementCode,
  type AchievementProgress,
} from "@/interfaces/badges";
import { achievementCounts, achievementPercent } from "@/lib/achievements";
import { formatRating } from "@/lib/meeting-ratings";
import { formatLongDate } from "@/lib/utils";

const ICONS: Record<AchievementCode, LucideIcon> = {
  [BadgeCode.FirstSession]: Sparkles,
  [BadgeCode.Sessions10]: CalendarCheck,
  [BadgeCode.Hours25]: Clock,
  [BadgeCode.WellRated]: Star,
  [BadgeCode.ActiveMentee]: MessageSquareText,
};

/** Rozetlerim › Başarı rozetleri: each achievement, earned with its date or with how far the person is. */
export function AchievementProgressList() {
  const t = useTranslations("badges");
  const query = useMyAchievements();
  const rows = query.data ?? [];
  const earned = rows.filter((row) => row.earned).length;

  return (
    <section aria-labelledby="my-achievements-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3
            id="my-achievements-title"
            className="text-[15px] font-semibold text-[#22262b]"
          >
            {t("achievements.title")}
          </h3>
          <p className="text-[12.5px] text-[#858c96]">
            {t("achievements.hint")}
          </p>
        </div>
        {rows.length > 0 ? (
          <Badge tone={earned > 0 ? "green" : "gray"}>
            {t("achievements.summary", { earned, total: rows.length })}
          </Badge>
        ) : null}
      </div>
      {query.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("achievements.loading")}
        </p>
      ) : null}
      {query.error ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {t("achievements.loadFailed")}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <Panel>
          <ul className="grid divide-y divide-[#eef0f2] sm:grid-cols-2 sm:divide-y-0">
            {rows.map((row) => (
              <AchievementTile key={row.code} row={row} />
            ))}
          </ul>
        </Panel>
      ) : null}
    </section>
  );
}

function AchievementTile({ row }: { row: AchievementProgress }) {
  const t = useTranslations("badges");
  const locale = useLocale();
  const Icon = ICONS[row.code];
  const name = t(`names.${row.code}`);
  const percent = achievementPercent(row);
  const counts = achievementCounts(row);

  return (
    <li className="flex gap-3 p-5 sm:border-b sm:border-[#eef0f2] sm:odd:border-r sm:last:border-b-0 sm:last:odd:col-span-2 sm:last:odd:border-r-0">
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          row.earned
            ? "bg-[#fdebdd] text-[#e86f22]"
            : "bg-[#f4f5f6] text-[#a3a9b1]"
        }`}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#22262b]">{name}</p>
          {row.earned ? (
            <Badge tone="green">{t("achievements.earned")}</Badge>
          ) : null}
        </div>
        <p className="text-[12.5px] leading-[18px] text-[#676e78]">
          {t(`descriptions.${row.code}`)}
        </p>
        {row.earned ? (
          row.awardedAt ? (
            <p className="text-xs text-[#858c96]">
              {t("achievements.earnedOn", {
                date: formatLongDate(row.awardedAt, locale),
              })}
            </p>
          ) : null
        ) : (
          <div className="space-y-1 pt-0.5">
            <div
              role="progressbar"
              aria-label={name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 overflow-hidden rounded-full bg-[#eceef0]"
            >
              <div
                className="h-full rounded-full bg-[#e86f22]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs leading-[18px] text-[#676e78]">
              {t(`achievements.progress.${row.code}`, counts)}
              {row.code === BadgeCode.WellRated && row.average != null
                ? t("achievements.average", {
                    average: formatRating(row.average, locale),
                    needed: formatRating(row.averageTarget, locale),
                  })
                : null}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}
