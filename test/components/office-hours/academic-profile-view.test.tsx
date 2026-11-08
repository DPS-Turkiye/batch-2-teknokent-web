import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicProfileView } from "@/components/office-hours/academic-profile-view";
import { Weekday } from "@/interfaces/mentor";
import { getOfficeHoursAvailability } from "@/lib/client/office-hours";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/office-hours", () => ({
  getOfficeHoursAvailability: vi.fn(),
  updateOfficeHoursAvailability: vi.fn(),
}));

function settings(rules: unknown[] = []) {
  return {
    rules,
    exceptions: [],
    menteeCapacity: null,
    defaultMeetingDurationMinutes: 45,
    meetingBufferMinutes: 15,
  } as never;
}

describe("AcademicProfileView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the weekly availability like a mentor's profile card", async () => {
    vi.mocked(getOfficeHoursAvailability).mockResolvedValue(
      settings([
        {
          id: "r1",
          dayOfWeek: Weekday.Thursday,
          startTime: "09:00:00",
          endTime: "17:00:00",
          slotMinutes: 45,
        },
      ]),
    );

    renderWithQueryClient(<AcademicProfileView fullName="Ali Kaya" />);

    expect(
      screen.getByRole("heading", { name: "Ali Kaya" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Perşembe")).toBeInTheDocument();
    expect(screen.getByText("09:00–17:00")).toBeInTheDocument();
    expect(screen.getByText("Diğer günler")).toBeInTheDocument();
  });

  it("says when no weekly hours are set", async () => {
    vi.mocked(getOfficeHoursAvailability).mockResolvedValue(settings());

    renderWithQueryClient(<AcademicProfileView fullName="Ali Kaya" />);

    expect(
      await screen.findByText("Tanımlı haftalık saat yok."),
    ).toBeInTheDocument();
  });

  it("opens the shared availability editor with a student limit instead of a mentorship limit", async () => {
    const user = userEvent.setup();
    vi.mocked(getOfficeHoursAvailability).mockResolvedValue(settings());
    renderWithQueryClient(<AcademicProfileView fullName="Ali Kaya" />);

    await user.click(
      screen.getByRole("button", { name: "Müsaitliği düzenle" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Ofis saatlerini düzenle" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Eş zamanlı öğrenci limiti"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Eş zamanlı mentorluk limiti"),
    ).not.toBeInTheDocument();
  });
});
