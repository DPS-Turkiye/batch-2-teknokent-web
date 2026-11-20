import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { useChangeFounder } from "@/hooks/use-change-founder";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import type { FounderChangeResult } from "@/interfaces/founder-change";
import { ToastTone } from "@/interfaces/toast";
import {
  changeFounder,
  getFounderChangeOptions,
} from "@/lib/client/founder-change";
import type { ToastInput } from "@/stores/toast-store";
import {
  founderChangeOptions,
  founderChangeResult,
} from "@test/fixtures/founder-change";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/founder-change", () => ({
  getFounderChangeOptions: vi.fn(),
  changeFounder: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  };
}

function setup(programId?: string) {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useChangeFounder("org-1", programId), {
    wrapper: wrapperFor(queryClient),
  });
  return { hook, invalidate };
}

async function opened(hook: ReturnType<typeof setup>["hook"]) {
  act(() => hook.result.current.show());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
}

describe("useChangeFounder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFounderChangeOptions).mockResolvedValue(
      founderChangeOptions(),
    );
    vi.mocked(changeFounder).mockResolvedValue(founderChangeResult());
  });

  it("asks the backend only once the dialog opens", async () => {
    const { hook } = setup();

    expect(getFounderChangeOptions).not.toHaveBeenCalled();
    await opened(hook);

    expect(hook.result.current.teamName).toBe("Yıldız Team");
    expect(hook.result.current.founderName).toBe("Merve Geçer");
    expect(hook.result.current.candidates).toHaveLength(2);
    expect(hook.result.current.canChange).toBe(false);
  });

  it("changes the founder, says so, closes and refreshes the lists", async () => {
    const { hook, invalidate } = setup("program-1");
    await opened(hook);
    act(() => hook.result.current.select("member-1"));
    expect(hook.result.current.canChange).toBe(true);

    act(() => hook.result.current.confirm());

    await waitFor(() => expect(hook.result.current.open).toBe(false));
    expect(changeFounder).toHaveBeenCalledWith("org-1", "member-1");
    expect(showToast).toHaveBeenCalledWith({
      message:
        "Zeynep Beyza Takkabulan artık Yıldız Team girişiminin kurucusu.",
      tone: ToastTone.Success,
    });
    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ["person-summary"],
        ADMIN_OVERVIEW_QUERY_KEY,
        programTeamsQueryKey("program-1"),
      ]),
    );
    expect(hook.result.current.candidateId).toBe("");
  });

  it("shows the backend's refusal and keeps the dialog open", async () => {
    vi.mocked(changeFounder).mockRejectedValue(new Error("Reddedildi."));
    const { hook } = setup();
    await opened(hook);
    act(() => hook.result.current.select("member-1"));

    act(() => hook.result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Reddedildi.",
        tone: ToastTone.Error,
      }),
    );
    expect(hook.result.current.open).toBe(true);
  });

  it("does not change without a choice, and stays open while a change is on its way", async () => {
    let finish: (value: FounderChangeResult) => void = () => undefined;
    vi.mocked(changeFounder).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { hook } = setup();
    await opened(hook);

    act(() => hook.result.current.confirm());
    expect(changeFounder).not.toHaveBeenCalled();

    act(() => hook.result.current.select("member-1"));
    act(() => hook.result.current.confirm());
    await waitFor(() => expect(hook.result.current.pending).toBe(true));
    act(() => hook.result.current.close());
    expect(hook.result.current.open).toBe(true);

    act(() => finish(founderChangeResult()));
    await waitFor(() => expect(hook.result.current.open).toBe(false));
  });

  it("asks again on every open and forgets the choice when closed", async () => {
    const { hook } = setup();
    await opened(hook);
    act(() => hook.result.current.select("member-1"));
    act(() => hook.result.current.close());
    expect(hook.result.current.candidateId).toBe("");
    vi.mocked(getFounderChangeOptions).mockResolvedValue(
      founderChangeOptions({ candidates: [] }),
    );

    await opened(hook);

    await waitFor(() => expect(hook.result.current.candidates).toHaveLength(0));
    expect(getFounderChangeOptions).toHaveBeenCalledTimes(2);
  });

  it("names why the members could not be loaded", async () => {
    vi.mocked(getFounderChangeOptions).mockRejectedValue(
      new Error("Team not found"),
    );
    const { hook } = setup();
    act(() => hook.result.current.show());

    await waitFor(() =>
      expect(hook.result.current.loadError).toBe("Team not found"),
    );
  });
});
