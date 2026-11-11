import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useStartupStatusForm } from "@/hooks/use-startup-status-form";
import { saveStartupStatus } from "@/lib/client/organization";
import { startupProfile } from "@test/fixtures/startup-profile";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/organization", () => ({
  getStartupProfile: vi.fn(),
  saveStartupProfile: vi.fn(),
  saveStartupStatus: vi.fn(),
}));

const profile = startupProfile({
  statusVersion: "v0.9.2",
  statusSummary: "Öğretmen modülü geliştirme aşamasında.",
  completionPercent: 72,
});

function setup(queryClient = createTestQueryClient()) {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <>
          {children}
          <Toaster />
        </>
      </QueryClientProvider>
    );
  }
  return renderHook(() => useStartupStatusForm(profile), { wrapper });
}

describe("useStartupStatusForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens with the current status filled in", () => {
    const { result } = setup();

    act(() => result.current.open());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.draft).toEqual({
      statusVersion: "v0.9.2",
      statusSummary: "Öğretmen modülü geliştirme aşamasında.",
      completionPercent: "72",
    });
  });

  it("refuses a completion rate outside 0 to 100", () => {
    const { result } = setup();
    act(() => result.current.open());

    act(() => result.current.setField("completionPercent", "140"));
    act(() => result.current.submit());

    expect(result.current.error).toContain("0 ile 100");
    expect(saveStartupStatus).not.toHaveBeenCalled();
  });

  it("saves blanks as cleared values and closes on success", async () => {
    const queryClient = createTestQueryClient();
    const saved = { ...profile, statusVersion: null, completionPercent: 80 };
    vi.mocked(saveStartupStatus).mockResolvedValue(saved);
    const { result } = setup(queryClient);
    act(() => result.current.open());

    act(() => {
      result.current.setField("statusVersion", "  ");
      result.current.setField("completionPercent", "80");
    });
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(vi.mocked(saveStartupStatus).mock.calls[0]?.[0]).toEqual({
      statusVersion: null,
      statusSummary: "Öğretmen modülü geliştirme aşamasında.",
      completionPercent: 80,
    });
    expect(queryClient.getQueryData(["startup-profile"])).toEqual(saved);
  });
});
