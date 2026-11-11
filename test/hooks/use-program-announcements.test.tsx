import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCoordinatorAnnouncements,
  useMyAnnouncements,
} from "@/hooks/use-program-announcements";
import {
  getMyAnnouncements,
  getProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/client/program-announcements";
import { programAnnouncement } from "@test/fixtures/program-announcements";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-announcements", () => ({
  getMyAnnouncements: vi.fn(),
  getProgramAnnouncements: vi.fn(),
  postProgramAnnouncement: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const programs = [{ id: "program-1", name: "METU Stars 2026" }];

describe("program announcement hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyAnnouncements).mockResolvedValue([programAnnouncement()]);
    vi.mocked(getProgramAnnouncements).mockResolvedValue([
      programAnnouncement(),
    ]);
    vi.mocked(postProgramAnnouncement).mockResolvedValue(programAnnouncement());
  });

  it("opens and closes a read-only program thread", async () => {
    const { result } = renderHook(() => useMyAnnouncements(), { wrapper });
    await waitFor(() => expect(result.current.threads).toHaveLength(1));

    act(() => result.current.open("program-1"));
    expect(result.current.active?.programName).toBe("METU Stars 2026");
    act(() => result.current.close());
    expect(result.current.active).toBeNull();
  });

  it("posts the trimmed draft to the open program and clears it", async () => {
    const { result } = renderHook(() => useCoordinatorAnnouncements(programs), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.threads[0]?.latest ?? null).not.toBeNull(),
    );

    act(() => result.current.open("program-1"));
    act(() => result.current.setDraft("  Demo Day  "));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.draft).toBe(""));
    expect(postProgramAnnouncement).toHaveBeenCalledWith(
      "program-1",
      "Demo Day",
    );
  });
});
