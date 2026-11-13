"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useAvailabilityRows } from "@/hooks/use-availability-rows";
import { useInstitutionAdvisees } from "@/hooks/use-institution-record";
import type { OfficeHoursRequest } from "@/interfaces/academician-office-hours";
import { availabilitySummary } from "@/lib/academician-availability";
import {
  anchorDay,
  appointmentsHref,
  awaitingStudent,
  calendarDays,
  calendarEntries,
  calendarTitle,
  compactHours,
  dayColumns,
  filterEntries,
  gridHours,
  isForeground,
  monthCells,
  nowOffset,
  parseAppointmentsSearch,
  pendingRequests,
  shiftAnchor,
  shortName,
  weekColumns,
  type AppointmentsSearch,
  type ConfirmedEntry,
  type RequestEntry,
  type TimedEntry,
} from "@/lib/academician-calendar";
import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  ACADEMICIAN_AVAILABILITY_QUERY_KEY,
  ACADEMICIAN_REQUESTS_QUERY_KEY,
  slotWhenLabel,
  turkeyWallClock,
} from "@/lib/academician-office-hours";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";
import { adviseeIds } from "@/lib/academician-students";
import {
  getAcademicianAppointments,
  getAcademicianAvailability,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";
import { isoDay, weekdayLabel } from "@/lib/coordinator-calendar";
import { formatDateRange } from "@/lib/format";
import {
  AppointmentsCalendarView,
  CalendarEntryKind,
  type AppointmentsFilter,
} from "@/types/academician-calendar";

/** One block or chip on the calendar, with every text it shows already written out. */
export type CalendarBlock = {
  key: string;
  kind: CalendarEntryKind;
  title: string;
  detail: string;
  hours: string;
  /** "10:00", for the month grid's chips. */
  startTime: string;
  ariaLabel: string;
  tourAnchor: boolean;
  /** Opens the request's or the appointment's drawer; availability blocks only show. */
  open: (() => void) | null;
};

export type PlacedBlock = CalendarBlock & {
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

export type RailRequest = {
  id: string;
  studentName: string;
  isAdvisee: boolean;
  topic: string;
  when: string;
  open: () => void;
};

const MONTH_HEADER_DAYS = 7;

/** Marks the history entry a drawer added, so closing it can step back instead of leaving a closed drawer behind. */
const DRAWER_OPENED_HERE = "academicianDrawerOpenedHere";

function drawerOpenedHere() {
  const state: unknown = window.history.state;
  return (
    typeof state === "object" &&
    state !== null &&
    DRAWER_OPENED_HERE in state &&
    state[DRAWER_OPENED_HERE] === true
  );
}

/**
 * Randevularım: one calendar for appointments, requests and availability. The view, its day, the filter and an
 * open drawer live in the URL and are read from it, so links from Ana Sayfa land on the right request, Back closes
 * the drawer and a reload keeps the week. Next.js syncs pushState/replaceState with useSearchParams.
 */
export function useAcademicianAppointmentsCalendar() {
  const t = useTranslations("iaAcademician.appointments");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const toRow = useAvailabilityRows({ everyWeek: true });
  const search = parseAppointmentsSearch(
    Object.fromEntries(useSearchParams().entries()),
  );
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
  // Advisees only add the "Danışanın" chip; the calendar works without them.
  const advisees = useInstitutionAdvisees();

  // Opening a drawer adds a history entry, so Back closes it; changing the view only rewrites the current one.
  const push = (next: AppointmentsSearch) => {
    window.history.pushState(
      { [DRAWER_OPENED_HERE]: true },
      "",
      appointmentsHref(ACADEMICIAN_ROUTES.appointments, next),
    );
  };
  const replace = (next: AppointmentsSearch) => {
    // The current entry's state is kept, so a view change under an open drawer still knows how it was opened.
    window.history.replaceState(
      window.history.state,
      "",
      appointmentsHref(ACADEMICIAN_ROUTES.appointments, next),
    );
  };
  const update = (change: Partial<AppointmentsSearch>) => {
    replace({ ...search, ...change });
  };

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
    return { ...shared, calendar: null };
  }

  // As of the last load, so a render stays pure and the server's first paint never disagrees about "today".
  const now = new Date(
    Math.max(
      requests.dataUpdatedAt,
      appointments.dataUpdatedAt,
      availability.dataUpdatedAt,
    ),
  );
  const source = {
    requests: requests.data,
    appointments: appointments.data,
    availability: availability.data,
  };
  const advisor = adviseeIds(advisees.data ?? []);
  const anchor = anchorDay(search.date, now);
  const days = calendarDays(search.view, anchor);
  const shown = filterEntries(calendarEntries(source, days), search.filter);
  const columns =
    search.view === AppointmentsCalendarView.Week
      ? weekColumns(days, shown)
      : days;
  const grid = gridHours(shown);
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const openRequest = (id: string) => {
    push({ ...search, request: id, appointment: null });
  };
  const openAppointment = (id: string) => {
    push({ ...search, appointment: id, request: null });
  };

  const toBlock = (entry: TimedEntry): CalendarBlock => {
    const hours = formatDateRange(clock, entry.span.start, entry.span.end);
    const status = t(`entry.${entry.kind}`);
    const base = {
      key: entry.key,
      kind: entry.kind,
      hours,
      startTime: clock.format(entry.span.start),
      tourAnchor: false,
    };
    switch (entry.kind) {
      case CalendarEntryKind.Confirmed:
      case CalendarEntryKind.PendingRequest:
      case CalendarEntryKind.AwaitingStudent: {
        const name = personOf(entry);
        return {
          ...base,
          title: name,
          detail: status,
          ariaLabel: t("blockLabel", { name, hours, status }),
          tourAnchor:
            entry.kind === CalendarEntryKind.PendingRequest && entry.tourAnchor,
          open:
            entry.kind === CalendarEntryKind.Confirmed
              ? () => {
                  openAppointment(entry.appointment.id);
                }
              : () => {
                  openRequest(entry.request.id);
                },
        };
      }
      case CalendarEntryKind.Recurring:
        return {
          ...base,
          title: status,
          detail: t("entryDetail.recurring", {
            weekday: tWeekday(entry.rule.dayOfWeek),
          }),
          ariaLabel: `${status} ${hours}`,
          open: null,
        };
      case CalendarEntryKind.OneOff:
        return {
          ...base,
          title: status,
          detail: t("entryDetail.oneOff"),
          ariaLabel: `${status} ${hours}`,
          open: null,
        };
    }
  };

  const today = isoDay(turkeyWallClock(now));
  const toRailRequest = (request: OfficeHoursRequest): RailRequest => {
    const first = request.requestedTimes[0];
    return {
      id: request.id,
      studentName: request.student.fullName,
      isAdvisee: advisor.has(request.student.userId),
      topic: request.topic,
      when: first ? slotWhenLabel(first, locale) : "",
      open: () => {
        openRequest(request.id);
      },
    };
  };
  const pending = pendingRequests(source.requests);

  return {
    ...shared,
    calendar: {
      view: search.view,
      setView: (view: AppointmentsCalendarView) => {
        update({ view });
      },
      filter: search.filter,
      setFilter: (filter: AppointmentsFilter) => {
        update({ filter });
      },
      requestCount: pending.length,
      title: calendarTitle(search.view, anchor, columns, locale),
      previous: () => {
        update({ date: isoDay(shiftAnchor(search.view, anchor, -1)) });
      },
      next: () => {
        update({ date: isoDay(shiftAnchor(search.view, anchor, 1)) });
      },
      goToToday: () => {
        update({ date: null });
      },
      hourLabels: Array.from({ length: grid.hours }, (_, index) =>
        clock.format(new Date(2000, 0, 1, grid.startHour + index)),
      ),
      gridHours: grid.hours,
      columns: dayColumns(columns, shown, grid).map((column) => ({
        key: column.key,
        label: `${weekdayLabel(column.day, locale)} ${String(column.day.getDate())}`,
        longLabel: new Intl.DateTimeFormat(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(column.day),
        isToday: column.key === today,
        nowOffset: nowOffset(now, column.day, grid),
        unavailable: column.unavailable
          ? {
              title: t("entry.unavailable"),
              detail: column.unavailable.exception.reason,
            }
          : null,
        foreground: column.foreground.map(
          ({ item, top, height, lane, lanes }): PlacedBlock => ({
            ...toBlock(item),
            top,
            height,
            lane,
            lanes,
          }),
        ),
        background: column.background.map(
          ({ item, top, height, lane, lanes }): PlacedBlock => ({
            ...toBlock(item),
            top,
            height,
            lane,
            lanes,
          }),
        ),
      })),
      monthHeaders: days
        .slice(0, MONTH_HEADER_DAYS)
        .map((day) => weekdayLabel(day, locale)),
      monthCells: monthCells(anchor, shown).map((cell) => ({
        key: cell.key,
        dayNumber: cell.day.getDate(),
        dayLabel: new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "long",
        }).format(cell.day),
        inMonth: cell.inMonth,
        isToday: cell.key === today,
        unavailable: cell.unavailable !== null,
        // Days of the neighbouring months stay empty, as in the frame, so the month reads at a glance.
        chips: cell.inMonth
          ? cell.chips.map((entry) => {
              const block = toBlock(entry);
              return isForeground(entry)
                ? {
                    ...block,
                    title: `${block.startTime} ${shortName(block.title)}`,
                  }
                : {
                    ...block,
                    title: t("available", {
                      hours: compactHours(entry.span.start, entry.span.end),
                    }),
                  };
            })
          : [],
        overflow: cell.inMonth ? cell.overflow : 0,
        openDay: () => {
          update({ view: AppointmentsCalendarView.Day, date: cell.key });
        },
      })),
      rail: {
        pending: pending.map(toRailRequest),
        awaiting: awaitingStudent(source.requests).map((request) => {
          const proposed = request.proposedTimes[0];
          return {
            ...toRailRequest(request),
            proposedWhen: proposed ? slotWhenLabel(proposed, locale) : null,
          };
        }),
        availability: availabilitySummary(source.availability, now).map(
          (item) => toRow(item, now),
        ),
      },
      selectedRequest:
        search.request === null
          ? null
          : (source.requests.find((item) => item.id === search.request) ??
            null),
      requestMissing:
        search.request !== null &&
        !source.requests.some((item) => item.id === search.request),
      selectedAppointment:
        search.appointment === null
          ? null
          : (source.appointments.find(
              (item) => item.id === search.appointment,
            ) ?? null),
      appointmentMissing:
        search.appointment !== null &&
        !source.appointments.some((item) => item.id === search.appointment),
      isAdvisee: (userId: string) => advisor.has(userId),
      // X does what Back does when the drawer was opened here, so the history doesn't keep a closed drawer;
      // a drawer reached by a link has nothing to go back to on this page, so it is just taken out of the URL.
      closeDrawer: () => {
        if (drawerOpenedHere()) {
          window.history.back();
          return;
        }
        replace({ ...search, request: null, appointment: null });
      },
      source,
      now,
      links: ACADEMICIAN_ROUTES,
    },
  };
}

function personOf(entry: ConfirmedEntry | RequestEntry) {
  return entry.kind === CalendarEntryKind.Confirmed
    ? entry.appointment.counterpart.fullName
    : entry.request.student.fullName;
}

export type AcademicianAppointmentsCalendar = NonNullable<
  ReturnType<typeof useAcademicianAppointmentsCalendar>["calendar"]
>;
