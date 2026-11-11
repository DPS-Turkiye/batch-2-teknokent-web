import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WeeklyCheckIn } from "@/components/startup/weekly-check-in";
import { AttendanceState } from "@/interfaces/program-attendance";
import {
  checkInMyAttendance,
  getMyAttendance,
} from "@/lib/client/program-attendance";
import { attendanceStatus } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  getMyAttendance: vi.fn(),
  checkInMyAttendance: vi.fn(),
}));

describe("WeeklyCheckIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks in for the running week the card shows", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(attendanceStatus());
    vi.mocked(checkInMyAttendance).mockResolvedValue(
      attendanceStatus({
        state: AttendanceState.CheckedIn,
        checkedInAt: "2026-11-10T09:30:00Z",
      }),
    );

    renderWithQueryClient(<WeeklyCheckIn />);

    expect(await screen.findByText(/Hafta 2\/8/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bu hafta katıldım" }));

    await waitFor(() => expect(checkInMyAttendance).toHaveBeenCalled());
    expect(vi.mocked(checkInMyAttendance).mock.calls[0]?.[0]).toBe(2);
    expect(
      await screen.findByText(/Bu haftaki katılımın kaydedildi \(/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bu hafta katıldım" }),
    ).not.toBeInTheDocument();
  });

  it("shows a check-in already made without a button", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({
        state: AttendanceState.CheckedIn,
        checkedInAt: "2026-11-10T09:30:00Z",
      }),
    );

    renderWithQueryClient(<WeeklyCheckIn />);

    expect(
      await screen.findByText(/Bu haftaki katılımın kaydedildi/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says why no week is open", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({
        state: AttendanceState.NotStarted,
        week: null,
        weekStart: null,
        weekEnd: null,
      }),
    );

    renderWithQueryClient(<WeeklyCheckIn />);

    expect(
      await screen.findByText(/Program henüz başlamadı/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows nothing to someone outside every program", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({ state: AttendanceState.NoProgram, programId: null }),
    );

    const { container } = renderWithQueryClient(<WeeklyCheckIn />);

    await waitFor(() => expect(getMyAttendance).toHaveBeenCalled());
    expect(container.querySelector("section")).toBeNull();
  });

  it("tells the participant when the check-in is refused", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(attendanceStatus());
    vi.mocked(checkInMyAttendance).mockRejectedValue(
      new Error("Bu hafta için zaten katılım işaretlendi."),
    );

    renderWithQueryClient(<WeeklyCheckIn />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Bu hafta katıldım" }),
    );

    expect(
      await screen.findByText("Bu hafta için zaten katılım işaretlendi."),
    ).toBeInTheDocument();
  });
});
