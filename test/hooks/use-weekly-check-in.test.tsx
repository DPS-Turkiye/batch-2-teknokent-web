import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWeeklyCheckIn } from "@/hooks/use-weekly-check-in";
import { AttendanceState } from "@/interfaces/program-attendance";
import {
  checkInMyAttendance,
  getMyAttendance,
} from "@/lib/client/program-attendance";
import { attendanceStatus } from "@test/fixtures/program-attendance";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", () => ({
  getMyAttendance: vi.fn(),
  checkInMyAttendance: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useWeeklyCheckIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks in for the week it shows and keeps the saved state", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(attendanceStatus());
    vi.mocked(checkInMyAttendance).mockResolvedValue(
      attendanceStatus({
        state: AttendanceState.CheckedIn,
        checkedInAt: "2026-11-10T09:30:00Z",
      }),
    );
    const { result } = renderHook(() => useWeeklyCheckIn(), { wrapper });
    await waitFor(() => expect(result.current.canCheckIn).toBe(true));
    expect(result.current.weekRange).toBe("9 Kas – 15 Kas");

    act(() => result.current.checkIn());

    await waitFor(() =>
      expect(result.current.status?.state).toBe(AttendanceState.CheckedIn),
    );
    expect(vi.mocked(checkInMyAttendance).mock.calls[0][0]).toBe(2);
    expect(result.current.canCheckIn).toBe(false);
  });

  it("offers nothing when no week is open, and hides outside every program", async () => {
    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({ state: AttendanceState.Ended, week: null }),
    );
    const { result } = renderHook(() => useWeeklyCheckIn(), { wrapper });
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => result.current.checkIn());
    expect(result.current.canCheckIn).toBe(false);
    expect(checkInMyAttendance).not.toHaveBeenCalled();

    vi.mocked(getMyAttendance).mockResolvedValue(
      attendanceStatus({ state: AttendanceState.NoProgram, programId: null }),
    );
    const { result: outside } = renderHook(() => useWeeklyCheckIn(), {
      wrapper,
    });
    await waitFor(() => expect(outside.current.status).toBeDefined());
    expect(outside.current.visible).toBe(false);
  });
});
