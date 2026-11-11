"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Appointment } from "@/interfaces/appointment";
import { monthGridCells } from "@/lib/calendar";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import {
  appointmentsOnDay,
  appointmentTabs,
  shiftAnchor,
  visibleDays,
} from "@/lib/student-appointments";
import { isAwaitingAnswer } from "@/lib/student-home";
import {
  AppointmentsTab,
  AppointmentsView,
} from "@/types/student-appointments";

export const STUDENT_APPOINTMENTS_QUERY_KEY = ["student-appointments"] as const;

export type StudentAppointmentsOptions = {
  /**
   * Narrows every view to the appointments it keeps. An extension point: the İŞKUR edition passes its
   * "Mentor olarak / Mentee olarak" filter here instead of changing this hook.
   */
  filter?: ((appointment: Appointment) => boolean) | undefined;
  /** The tab to open on, e.g. Talepler right after a request was sent. */
  initialTab?: AppointmentsTab | undefined;
};

function today() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day;
}

/** Randevularım: the list tabs and the day, week and month calendars over the same appointments. */
export function useStudentAppointments({
  filter,
  initialTab = AppointmentsTab.Upcoming,
}: StudentAppointmentsOptions = {}) {
  const query = useQuery({
    queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
    queryFn: getStudentAppointments,
  });
  const [view, setView] = useState(AppointmentsView.List);
  const [tab, setTab] = useState(initialTab);
  const [anchor, setAnchor] = useState(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(today);

  // As of the last load, so a render stays pure; each refetch moves it forward.
  const now = new Date(query.dataUpdatedAt);
  const all = (query.data ?? []).filter((item) => filter?.(item) ?? true);
  const tabs = appointmentTabs(all, now);
  const days = visibleDays(view, anchor).map((day) => ({
    day,
    items: appointmentsOnDay(all, day),
  }));
  const month =
    view === AppointmentsView.Month
      ? monthGridCells(anchor).map((cell) => ({
          ...cell,
          items: appointmentsOnDay(all, cell.date),
        }))
      : [];
  const inRange = days.flatMap((column) => column.items);
  // The detail panel opens on what was clicked, else on the first request in view, else on the first session.
  const selected =
    all.find((item) => item.id === selectedId) ??
    inRange.find(isAwaitingAnswer) ??
    inRange[0] ??
    null;

  const changeView = (next: AppointmentsView) => {
    setView(next);
    setSelectedId(null);
  };

  return {
    isLoading: query.isLoading,
    error: query.error,
    retry: () => {
      void query.refetch();
    },
    isRetrying: query.isFetching,
    isEmpty: query.data?.length === 0,
    view,
    setView: changeView,
    tab,
    setTab,
    tabs,
    anchor,
    today: today(),
    previous: () => setAnchor((current) => shiftAnchor(view, current, -1)),
    next: () => setAnchor((current) => shiftAnchor(view, current, 1)),
    goToday: () => {
      setAnchor(today());
      setSelectedDay(today());
    },
    days,
    month,
    selected,
    select: (appointment: Appointment) => setSelectedId(appointment.id),
    selectedDay,
    selectedDayItems: appointmentsOnDay(all, selectedDay),
    selectDay: setSelectedDay,
  };
}

export type StudentAppointmentsModel = ReturnType<
  typeof useStudentAppointments
>;
