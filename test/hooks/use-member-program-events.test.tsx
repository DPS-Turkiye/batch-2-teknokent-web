import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMemberProgramEvents } from "@/hooks/use-member-program-events";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { lessonSession } from "@test/fixtures/program-calendar";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/programs", () => ({ getMemberProgramEvents: vi.fn() }));

const RANGE = { from: new Date(2026, 10, 16), to: new Date(2026, 10, 23) };

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useMemberProgramEvents", () => {
  beforeEach(() => {
    vi.mocked(getMemberProgramEvents).mockReset();
  });

  it("reads the caller's program entries for the range", async () => {
    vi.mocked(getMemberProgramEvents).mockResolvedValue([lessonSession()]);

    const { result } = renderHook(() => useMemberProgramEvents(RANGE), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(getMemberProgramEvents).toHaveBeenCalledWith(RANGE);
  });
});
