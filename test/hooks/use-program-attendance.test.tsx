import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramAttendance } from "@/hooks/use-program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";
import { getProgramAttendance } from "@/lib/client/program-attendance";
import { attendanceReport } from "@test/fixtures/program-attendance";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-attendance")>()),
  getProgramAttendance: vi.fn(),
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
    expect(result.current.exportHref(SessionsExportFormat.Csv)).toBeUndefined();

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
});
