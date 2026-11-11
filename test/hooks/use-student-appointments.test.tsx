import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudentAppointments } from "@/hooks/use-student-appointments";
import {
  AppointmentSide,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import {
  AppointmentsTab,
  AppointmentsView,
} from "@/types/student-appointments";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const request = peerAppointment({
  id: "request",
  status: AppointmentStatus.Pending,
  startsAt: "2026-11-10T09:00:00.000Z",
  endsAt: "2026-11-10T09:30:00.000Z",
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(APPOINTMENTS_NOW);
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue([...STUDENT_APPOINTMENTS, request]);
});

afterEach(() => {
  vi.useRealTimers();
});

async function loaded(options?: Parameters<typeof useStudentAppointments>[0]) {
  const hook = renderHook(() => useStudentAppointments(options), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe("useStudentAppointments", () => {
  it("opens the list on Yaklaşan with the three tabs filled", async () => {
    const { result } = await loaded();
    expect(result.current.view).toBe(AppointmentsView.List);
    expect(result.current.tab).toBe(AppointmentsTab.Upcoming);
    expect(result.current.tabs[AppointmentsTab.Requests]).toEqual([request]);
    expect(result.current.tabs[AppointmentsTab.Past]).toHaveLength(2);
  });

  it("opens on the tab it is asked to", async () => {
    const { result } = await loaded({ initialTab: AppointmentsTab.Requests });
    expect(result.current.tab).toBe(AppointmentsTab.Requests);
  });

  it("narrows every view with the filter it is given", async () => {
    const asMentee = (item: Appointment) =>
      item.side === AppointmentSide.Mentee;
    const { result } = await loaded({ filter: asMentee });
    expect(
      result.current.tabs[AppointmentsTab.Upcoming].map((item) => item.id),
    ).toEqual(["meeting-1"]);
  });

  it("shows the week around today and opens the detail on its first request", async () => {
    const { result } = await loaded();
    act(() => result.current.setView(AppointmentsView.Week));

    expect(result.current.days).toHaveLength(7);
    expect(result.current.selected?.id).toBe("request");

    const confirmed = result.current.days
      .flatMap((column) => column.items)
      .find((item) => item.id === "meeting-1");
    expect(confirmed).toBeDefined();
    act(() => {
      if (confirmed) result.current.select(confirmed);
    });
    expect(result.current.selected?.id).toBe("meeting-1");
  });

  it("moves the calendar back and forth and returns to today", async () => {
    const { result } = await loaded();
    act(() => result.current.setView(AppointmentsView.Week));
    const start = result.current.days[0]?.day;

    act(() => result.current.next());
    expect(result.current.days[0]?.day.getDate()).toBe(
      (start?.getDate() ?? 0) + 7,
    );
    expect(result.current.selected).toBeNull();

    act(() => result.current.previous());
    act(() => result.current.previous());
    act(() => result.current.goToday());
    expect(result.current.days[0]?.day).toEqual(start);
  });

  it("lists a picked day of the month", async () => {
    const { result } = await loaded();
    act(() => result.current.setView(AppointmentsView.Month));
    expect(result.current.month.length % 7).toBe(0);

    act(() => result.current.selectDay(new Date(2026, 10, 12)));
    expect(result.current.selectedDayItems.map((item) => item.id)).toEqual([
      "meeting-1",
    ]);
  });
});
