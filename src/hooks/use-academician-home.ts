"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import {
  useInstitutionAdvisees,
  useInstitutionRecord,
} from "@/hooks/use-institution-record";
import { useRequestAnswer } from "@/hooks/use-request-answer";
import {
  OfficeHoursRequestAction,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import type { AppointmentTime } from "@/interfaces/appointment";
import type { AvailabilityItem } from "@/lib/academician-availability";
import { daysSince, greetingName, homeSummary } from "@/lib/academician-home";
import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  ACADEMICIAN_AVAILABILITY_QUERY_KEY,
  ACADEMICIAN_REQUESTS_QUERY_KEY,
  slotWhenLabel,
} from "@/lib/academician-office-hours";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";
import { adviseeIds } from "@/lib/academician-students";
import {
  getAcademicianAppointments,
  getAcademicianAvailability,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";
import { timeLabel } from "@/lib/coordinator-calendar";
import { formatDateRange } from "@/lib/format";
import { exceptionLabel } from "@/lib/mentor-availability";
import { dayPart } from "@/lib/utils";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

export type HomeRequestCard = {
  id: string;
  studentName: string;
  isAdvisee: boolean;
  when: string;
  topic: string;
  /** Set when the request names one time, so Kabul Et can book it right here. */
  acceptTime: AppointmentTime | null;
  canDecline: boolean;
  canPropose: boolean;
};

export type HomeAvailabilityRow = {
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

/** Ana Sayfa: what needs the academician today, from the same queries as Randevularım. */
export function useAcademicianHome() {
  const t = useTranslations("iaAcademician");
  const tGreeting = useTranslations("common.greeting");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const record = useInstitutionRecord();
  const advisees = useInstitutionAdvisees();
  const requests = useQuery({
    queryKey: ACADEMICIAN_REQUESTS_QUERY_KEY,
    queryFn: getAcademicianRequests,
  });
  const appointments = useQuery({
    queryKey: ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
    queryFn: getAcademicianAppointments,
  });
  const availability = useQuery({
    queryKey: ACADEMICIAN_AVAILABILITY_QUERY_KEY,
    queryFn: getAcademicianAvailability,
  });
  const { answer, answeringId } = useRequestAnswer();

  const queries = [requests, appointments, availability];
  const shared = {
    isLoading: queries.some((query) => query.isLoading),
    error: queries.find((query) => query.error)?.error ?? null,
    retry: () => {
      for (const query of queries) void query.refetch();
    },
    isRetrying: queries.some((query) => query.isRefetching),
  };
  if (!requests.data || !appointments.data || !availability.data) {
    return { ...shared, home: null };
  }

  // As of the last load rather than the render, so a render stays pure; each refetch moves it on.
  const now = new Date(
    Math.max(
      requests.dataUpdatedAt,
      appointments.dataUpdatedAt,
      availability.dataUpdatedAt,
    ),
  );
  const summary = homeSummary({
    requests: requests.data,
    appointments: appointments.data,
    availability: availability.data,
    now,
  });
  const advisor = adviseeIds(advisees.data ?? []);
  const name = greetingName(record.data?.fullName ?? null);
  const hello = tGreeting(dayPart(now));
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hours = (startsAt: string, endsAt: string) =>
    formatDateRange(clock, new Date(startsAt), new Date(endsAt));

  const toCard = (request: OfficeHoursRequest): HomeRequestCard => {
    const [first, ...others] = request.requestedTimes;
    return {
      id: request.id,
      studentName: request.student.fullName,
      isAdvisee: advisor.has(request.student.userId),
      when: first ? slotWhenLabel(first, locale) : "",
      topic: request.topic,
      acceptTime:
        first &&
        others.length === 0 &&
        request.allowedActions.includes(OfficeHoursRequestAction.Accept)
          ? first
          : null,
      canDecline: request.allowedActions.includes(
        OfficeHoursRequestAction.Decline,
      ),
      canPropose: request.allowedActions.includes(
        OfficeHoursRequestAction.ProposeTimes,
      ),
    };
  };

  const toRow = (item: AvailabilityItem): HomeAvailabilityRow => {
    switch (item.kind) {
      case AvailabilityItemKind.Recurring:
        return {
          key: item.rule.id,
          kind: item.kind,
          label: tWeekday(item.rule.dayOfWeek),
          hours: `${item.rule.startTime} – ${item.rule.endTime}`,
        };
      case AvailabilityItemKind.OneOff:
        return {
          key: item.oneOff.id ?? item.oneOff.startsAt,
          kind: item.kind,
          label: t("common.oneOff", {
            date: new Intl.DateTimeFormat(locale, ONE_OFF_DAY).format(
              new Date(item.oneOff.startsAt),
            ),
          }),
          hours: hours(item.oneOff.startsAt, item.oneOff.endsAt),
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
              ? t("common.unavailable", { days })
              : t("common.unavailableBecause", { days, reason }),
          hours: "",
        };
      }
    }
  };

  const oldest = summary.oldestRequestedAt;
  const first = summary.today[0];
  const weekHours = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(summary.week.minutes / 60);

  return {
    ...shared,
    home: {
      greeting:
        name === null ? hello : t("home.greeting", { greeting: hello, name }),
      hasAvailability: summary.hasAvailability,
      pendingCount: summary.pendingCount,
      stats: {
        pending: {
          value: summary.pendingCount,
          hint:
            oldest === null
              ? t("home.stats.pendingNone")
              : t("home.stats.pendingOldest", {
                  ago: new Intl.RelativeTimeFormat(locale, {
                    numeric: "auto",
                  }).format(-daysSince(oldest, now), "day"),
                }),
        },
        today: {
          value: summary.today.length,
          hint: first
            ? t("home.stats.todayFirst", {
                time: timeLabel(first.startsAt, locale),
              })
            : t("home.stats.todayNone"),
        },
        week: {
          value: weekHours,
          hint: summary.week.weekdays.length
            ? new Intl.ListFormat(locale, { type: "conjunction" }).format(
                summary.week.weekdays.map((weekday) => tWeekday(weekday)),
              )
            : t("home.stats.weekNone"),
        },
        advisees: advisees.data?.length ?? null,
        upcoming: summary.upcomingCount,
      },
      requests: summary.latestRequests.map(toCard),
      today: summary.today.map((item) => ({
        id: item.id,
        time: timeLabel(item.startsAt, locale),
        studentName: item.counterpart.fullName,
        topic: item.topic,
      })),
      availability: summary.availability.map(toRow),
      accept: (card: HomeRequestCard) => {
        if (card.acceptTime === null) return;
        answer(card.id, {
          action: OfficeHoursRequestAction.Accept,
          time: card.acceptTime,
        });
      },
      answeringId,
      links: ACADEMICIAN_ROUTES,
    },
  };
}

export type AcademicianHome = NonNullable<
  ReturnType<typeof useAcademicianHome>["home"]
>;
