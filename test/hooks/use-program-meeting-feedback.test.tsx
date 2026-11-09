import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramMeetingFeedback } from "@/hooks/use-program-report";
import { getProgramMeetingFeedback } from "@/lib/client/program-report";
import { programMeetingFeedback } from "@test/fixtures/program-report";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-report", () => ({
  getProgramMeetingFeedback: vi.fn(),
  getProgramMeetingRatings: vi.fn(),
  getProgramReport: vi.fn(),
  getProgramSessions: vi.fn(),
  programSessionsExportHref: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function page(number: number, totalPages: number) {
  return {
    content: [programMeetingFeedback({ id: `feedback-${number}` })],
    page: number,
    size: 20,
    totalElements: totalPages * 20,
    totalPages,
  };
}

describe("useProgramMeetingFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramMeetingFeedback).mockImplementation(
      async (_programId, query) => page(query.page, 3),
    );
  });

  it("loads the first page for the program's window", async () => {
    const { result } = renderHook(
      () => useProgramMeetingFeedback("program-1", "2026-11-01"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.feedback).toHaveLength(1));
    expect(getProgramMeetingFeedback).toHaveBeenCalledWith("program-1", {
      from: "2026-11-01",
      page: 0,
    });
    expect(result.current.total).toBe(60);
    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.hasNext).toBe(true);
  });

  it("moves between pages and stops at both ends", async () => {
    const { result } = renderHook(
      () => useProgramMeetingFeedback("program-1", null),
      { wrapper },
    );
    await waitFor(() => expect(result.current.totalPages).toBe(3));

    act(() => result.current.previous());
    expect(result.current.page).toBe(0);
    act(() => result.current.next());
    act(() => result.current.next());
    await waitFor(() =>
      expect(result.current.feedback[0]?.id).toBe("feedback-2"),
    );
    act(() => result.current.next());
    expect(result.current.page).toBe(2);
    expect(result.current.hasNext).toBe(false);
    expect(getProgramMeetingFeedback).toHaveBeenLastCalledWith("program-1", {
      from: null,
      page: 2,
    });
  });

  it("asks nothing before a program is chosen", () => {
    const { result } = renderHook(() => useProgramMeetingFeedback(null, null), {
      wrapper,
    });

    expect(result.current.feedback).toEqual([]);
    expect(getProgramMeetingFeedback).not.toHaveBeenCalled();
  });
});
