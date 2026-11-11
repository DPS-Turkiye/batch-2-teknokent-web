import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { BackendErrorCode } from "@/interfaces/ai-features";
import { AI_FEATURES_ALL_ON } from "@/lib/ai-features";
import { getAiFeatures } from "@/lib/client/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { aiFeatures } from "@test/fixtures/ai-features";

vi.mock("@/lib/client/ai-features", () => ({ getAiFeatures: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function useSwitchesAndRefusal() {
  return { features: useAiFeatures(), refused: useAiFeatureRefusal() };
}

beforeEach(() => vi.clearAllMocks());

describe("useAiFeatures", () => {
  it("counts every feature as on until the switches arrive, then uses them", async () => {
    const switches = aiFeatures({ syllabus: false, meetingReport: false });
    vi.mocked(getAiFeatures).mockResolvedValue(switches);

    const { result } = renderHook(() => useAiFeatures(), { wrapper });

    expect(result.current).toEqual(AI_FEATURES_ALL_ON);
    await waitFor(() => expect(result.current).toEqual(switches));
  });

  it("keeps every feature on when the switches cannot be read", async () => {
    vi.mocked(getAiFeatures).mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useAiFeatures(), { wrapper });

    await waitFor(() => expect(getAiFeatures).toHaveBeenCalled());
    expect(result.current).toEqual(AI_FEATURES_ALL_ON);
  });

  it("reads the switches again after the backend refused a switched-off call", async () => {
    vi.mocked(getAiFeatures).mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => useSwitchesAndRefusal(), { wrapper });
    await waitFor(() => expect(getAiFeatures).toHaveBeenCalledTimes(1));
    expect(result.current.features).toEqual(AI_FEATURES_ALL_ON);
    vi.mocked(getAiFeatures).mockResolvedValue(
      aiFeatures({ profileParsing: false }),
    );

    let handled = false;
    act(() => {
      handled = result.current.refused(
        new ClientApiError("off", 403, BackendErrorCode.AiFeatureDisabled),
      );
    });

    expect(handled).toBe(true);
    await waitFor(() =>
      expect(result.current.features.profileParsing).toBe(false),
    );
  });

  it("leaves any other failure to the caller", async () => {
    vi.mocked(getAiFeatures).mockResolvedValue(aiFeatures());
    const { result } = renderHook(() => useSwitchesAndRefusal(), { wrapper });
    await waitFor(() => expect(getAiFeatures).toHaveBeenCalledTimes(1));

    expect(result.current.refused(new ClientApiError("yasak", 403))).toBe(
      false,
    );
    expect(getAiFeatures).toHaveBeenCalledTimes(1);
  });
});
