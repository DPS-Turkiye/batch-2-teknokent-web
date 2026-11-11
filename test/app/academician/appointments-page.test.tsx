import { describe, expect, it, vi } from "vitest";

import AcademicianAppointmentsPage from "@/app/academician/appointments/page";
import { AcademicianAppointmentsView } from "@/components/academician/appointments-view";
import {
  AppointmentsCalendarView,
  AppointmentsFilter,
} from "@/types/academician-calendar";

vi.mock("@/components/academician/appointments-view", () => ({
  AcademicianAppointmentsView: vi.fn(() => null),
}));

describe("academician appointments page", () => {
  it("hands the view what the URL asks for, trusting only known values", async () => {
    const page = await AcademicianAppointmentsPage({
      searchParams: Promise.resolve({
        view: "day",
        date: "2026-11-17",
        filter: "nonsense",
        request: "sample-request-1",
      }),
    });

    expect(page.type).toBe(AcademicianAppointmentsView);
    expect(page.props).toEqual({
      initial: {
        view: AppointmentsCalendarView.Day,
        date: "2026-11-17",
        filter: AppointmentsFilter.All,
        request: "sample-request-1",
        appointment: null,
      },
    });
  });
});
