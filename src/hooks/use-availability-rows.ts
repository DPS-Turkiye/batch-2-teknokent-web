"use client";

import { useLocale, useTranslations } from "next-intl";

import type { AvailabilityItem } from "@/lib/academician-availability";
import { formatDateRange } from "@/lib/format";
import { exceptionLabel } from "@/lib/mentor-availability";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

export type AvailabilityRow = {
  key: string;
  kind: AvailabilityItemKind;
  label: string;
  /** The hours; empty for a day off, whose label says it all. */
  hours: string;
};

const ONE_OFF_DAY: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};

/**
 * Turns "Müsaitliğim" items into labelled rows. Ana Sayfa names the weekday ("Salı"), the calendar's rail says
 * "Her Salı", so `everyWeek` picks the wording.
 */
export function useAvailabilityRows({ everyWeek }: { everyWeek: boolean }) {
  const t = useTranslations("iaAcademician.common");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (item: AvailabilityItem, now: Date): AvailabilityRow => {
    switch (item.kind) {
      case AvailabilityItemKind.Recurring: {
        const weekday = tWeekday(item.rule.dayOfWeek);
        return {
          key: item.rule.id,
          kind: item.kind,
          label: everyWeek ? t("everyWeekday", { weekday }) : weekday,
          hours: `${item.rule.startTime} – ${item.rule.endTime}`,
        };
      }
      case AvailabilityItemKind.OneOff:
        return {
          key: item.oneOff.id ?? item.oneOff.startsAt,
          kind: item.kind,
          label: t("oneOff", {
            date: new Intl.DateTimeFormat(locale, ONE_OFF_DAY).format(
              new Date(item.oneOff.startsAt),
            ),
          }),
          hours: formatDateRange(
            clock,
            new Date(item.oneOff.startsAt),
            new Date(item.oneOff.endsAt),
          ),
        };
      case AvailabilityItemKind.Unavailable: {
        const { reason } = item.exception;
        const days = exceptionLabel(
          { ...item.exception, reason: null },
          locale,
          now,
        );
        return {
          key: item.exception.id ?? item.exception.startsOn,
          kind: item.kind,
          label:
            reason === null
              ? t("unavailable", { days })
              : t("unavailableBecause", { days, reason }),
          hours: "",
        };
      }
    }
  };
}
