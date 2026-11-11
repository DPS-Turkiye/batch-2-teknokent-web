"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import {
  useAvailabilityRows,
  type AvailabilityRow,
} from "@/hooks/use-availability-rows";
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
import { appointmentsHref } from "@/lib/academician-calendar";
import { daysSince, greetingName, homeSummary } from "@/lib/academician-home";
import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  ACADEMICIAN_AVAILABILITY_QUERY_KEY,
  ACADEMICIAN_REQUESTS_QUERY_KEY,
  acceptableTime,
  slotWhenLabel,
  turkeyTime,
} from "@/lib/academician-office-hours";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";
import { adviseeIds } from "@/lib/academician-students";
import {
  getAcademicianAppointments,
  getAcademicianAvailability,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";
import { dayPart } from "@/lib/utils";
import { AppointmentsFilter } from "@/types/academician-calendar";

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
  /** The request's drawer on Randevularım. */
  href: string;
};

export type HomeAvailabilityRow = AvailabilityRow;

/** Ana Sayfa: what needs the academician today, from the same queries as Randevularım. */
export function useAcademicianHome() {
  const t = useTranslations("iaAcademician");
  const tGreeting = useTranslations("common.greeting");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const toRow = useAvailabilityRows({ everyWeek: false });
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
  const calendarHref = (search: Parameters<typeof appointmentsHref>[1]) =>
    appointmentsHref(ACADEMICIAN_ROUTES.appointments, search);

  const toCard = (request: OfficeHoursRequest): HomeRequestCard => {
    const [first] = request.requestedTimes;
    return {
      id: request.id,
      studentName: request.student.fullName,
      isAdvisee: advisor.has(request.student.userId),
      when: first ? slotWhenLabel(first, locale) : "",
      topic: request.topic,
      acceptTime: acceptableTime(request),
      canDecline: request.allowedActions.includes(
        OfficeHoursRequestAction.Decline,
      ),
      canPropose: request.allowedActions.includes(
        OfficeHoursRequestAction.ProposeTimes,
      ),
      href: calendarHref({ request: request.id }),
    };
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
                time: turkeyTime(first.startsAt, locale),
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
        time: turkeyTime(item.startsAt, locale),
        studentName: item.counterpart.fullName,
        topic: item.topic,
        href: calendarHref({ appointment: item.id }),
      })),
      availability: summary.availability.map((item) => toRow(item, now)),
      accept: (card: HomeRequestCard) => {
        if (card.acceptTime === null) return;
        answer(card.id, {
          action: OfficeHoursRequestAction.Accept,
          time: card.acceptTime,
        });
      },
      answeringId,
      links: {
        ...ACADEMICIAN_ROUTES,
        allRequests: calendarHref({ filter: AppointmentsFilter.Requests }),
      },
    },
  };
}

export type AcademicianHome = NonNullable<
  ReturnType<typeof useAcademicianHome>["home"]
>;
