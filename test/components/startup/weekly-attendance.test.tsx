import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WeeklyAttendance } from "@/components/startup/weekly-attendance";
import { WEEKLY_ATTENDANCE_QUERY_KEY } from "@/hooks/use-weekly-attendance";
import { AttendanceState } from "@/interfaces/program-attendance";
import { getMyAttendance } from "@/lib/client/program-attendance";
import { itemAt } from "@test/fixtures/list-assertions";
import { attendanceStatus } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  getMyAttendance: vi.fn(),
}));

describe("WeeklyAttendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists this week's lesson and workshop and whether attendance was taken, with no button to tap", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(attendanceStatus());

    renderWithQueryClient(<WeeklyAttendance />);

    expect(await screen.findByText(/Hafta 2\/8/)).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    const lesson = itemAt(items, 0);
    const workshop = itemAt(items, 1);
    expect(lesson).toHaveTextContent("Eğitim");
    expect(lesson).toHaveTextContent("Pzt 9 Kas · 18:00–20:00");
    expect(within(lesson).getByText("Katıldın")).toBeInTheDocument();
    expect(workshop).toHaveTextContent("Workshop");
    expect(within(workshop).getByText("Kayıt yok")).toBeInTheDocument();
    expect(
      screen.getByText(/QR kodu telefonunla okutarak/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says when the running week has no session that takes attendance", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({ sessions: [] }),
    );

    renderWithQueryClient(<WeeklyAttendance />);

    expect(
      await screen.findByText("Bu hafta yoklama alınan bir oturum yok."),
    ).toBeInTheDocument();
  });

  it("says why no week is open", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({
        state: AttendanceState.NotStarted,
        week: null,
        weekStart: null,
        weekEnd: null,
        sessions: [],
      }),
    );

    renderWithQueryClient(<WeeklyAttendance />);

    expect(
      await screen.findByText("Program henüz başlamadı."),
    ).toBeInTheDocument();
  });

  it.each([AttendanceState.NoProgram, AttendanceState.Disabled])(
    "shows nothing when the state is %s",
    async (state) => {
      vi.mocked(getMyAttendance).mockResolvedValue(
        attendanceStatus({ state, week: null, sessions: [] }),
      );

      const { queryClient } = renderWithQueryClient(<WeeklyAttendance />);

      await waitFor(() =>
        expect(
          queryClient.getQueryState(WEEKLY_ATTENDANCE_QUERY_KEY)?.status,
        ).toBe("success"),
      );
      expect(screen.queryByText("Bu haftaki yoklaman")).not.toBeInTheDocument();
    },
  );
});
