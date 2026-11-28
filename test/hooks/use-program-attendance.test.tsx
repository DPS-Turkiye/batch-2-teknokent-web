import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramAttendance } from "@/hooks/use-program-attendance";
import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  downloadProgramAttendance,
  getProgramAttendance,
  markSessionAttendance,
} from "@/lib/client/program-attendance";
import { useToastStore } from "@/stores/toast-store";
import { itemAt } from "@test/fixtures/list-assertions";
import { attendanceReport } from "@test/fixtures/program-attendance";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-attendance")>()),
  downloadProgramAttendance: vi.fn(),
  getProgramAttendance: vi.fn(),
  markSessionAttendance: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useProgramAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramAttendance).mockResolvedValue(attendanceReport());
  });

  it("covers the whole program until a full range is chosen", async () => {
    const { result } = renderHook(() => useProgramAttendance("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.query.data).toBeDefined());
    expect(getProgramAttendance).toHaveBeenCalledWith("program-1", null);

    act(() => result.current.setFrom("2026-11-09"));
    expect(result.current.valid).toBe(false);
    expect(result.current.canExport).toBe(false);
    act(() => result.current.exportFile(SessionsExportFormat.Csv));
    expect(downloadProgramAttendance).not.toHaveBeenCalled();

    act(() => result.current.setTo("2026-11-12"));
    expect(result.current.valid).toBe(true);
    await waitFor(() =>
      expect(getProgramAttendance).toHaveBeenLastCalledWith("program-1", {
        from: "2026-11-09",
        to: "2026-11-12",
      }),
    );
  });

  it("refuses a range that ends before it starts", () => {
    const { result } = renderHook(() => useProgramAttendance("program-1"), {
      wrapper,
    });

    act(() => {
      result.current.setFrom("2026-11-12");
      result.current.setTo("2026-11-09");
    });

    expect(result.current.valid).toBe(false);
  });

  it("names each column and only lets a lesson of a current participant be changed", async () => {
    const report = attendanceReport();
    const { result } = renderHook(() => useProgramAttendance("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.query.data).toBeDefined());
    const gulse = itemAt(report.participants, 0);
    const mert = itemAt(report.participants, 1);

    expect(result.current.sessionLabel(itemAt(report.sessions, 0))).toBe(
      "Eğitim 2 Kas",
    );
    expect(result.current.sessionLabel(itemAt(report.sessions, 1))).toBe(
      "Haftalık (eski)",
    );
    expect(result.current.cell(gulse, 0)).toMatchObject({
      attended: false,
      status: "Katılmadı",
      toggleLabel: "Gülse Buran, H1 Eğitim 2 Kas: katıldı",
    });
    expect(result.current.cell(gulse, 1)).toMatchObject({
      attended: true,
      status: "Haftalık işaret (eski)",
      toggleLabel: null,
    });
    expect(result.current.cell(mert, 0)).toMatchObject({
      status: "Koordinatör işaretledi",
      toggleLabel: null,
    });

    act(() => {
      result.current.cell(mert, 2).toggle();
      result.current.cell(gulse, 1).toggle();
    });
    expect(markSessionAttendance).not.toHaveBeenCalled();
  });

  it("toasts the backend's reason when a mark is refused", async () => {
    vi.mocked(markSessionAttendance).mockRejectedValue(
      new Error("Bu oturum henüz yapılmadı; katılım işaretlenemez."),
    );
    const report = attendanceReport();
    const { result } = renderHook(() => useProgramAttendance("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.query.data).toBeDefined());

    act(() => result.current.cell(itemAt(report.participants, 0), 0).toggle());

    await waitFor(() =>
      expect(markSessionAttendance).toHaveBeenCalledWith(
        "program-1",
        { week: 1, kind: AttendanceSessionKind.Lesson },
        "user-gulse",
      ),
    );
    await waitFor(() =>
      expect(
        useToastStore.getState().toasts.map((toast) => toast.message),
      ).toContain("Bu oturum henüz yapılmadı; katılım işaretlenemez."),
    );
  });

  it("asks for the file of the chosen range and toasts why it could not be prepared", async () => {
    vi.mocked(downloadProgramAttendance).mockRejectedValue(
      new Error("Katılım bu programda kapalı."),
    );
    const { result } = renderHook(() => useProgramAttendance("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.canExport).toBe(true));

    act(() => result.current.exportFile(SessionsExportFormat.Xlsx));

    await waitFor(() =>
      expect(downloadProgramAttendance).toHaveBeenCalledWith("program-1", {
        range: null,
        format: SessionsExportFormat.Xlsx,
      }),
    );
    await waitFor(() =>
      expect(
        useToastStore.getState().toasts.map((toast) => toast.message),
      ).toContain("Katılım bu programda kapalı."),
    );
  });
});
