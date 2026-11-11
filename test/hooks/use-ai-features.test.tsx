import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatures } from "@/hooks/use-ai-features";
import { AI_FEATURES_ALL_ON } from "@/lib/ai-features";
import { getAiFeatures } from "@/lib/client/ai-features";
import { aiFeatures } from "@test/fixtures/ai-features";

vi.mock("@/lib/client/ai-features", () => ({ getAiFeatures: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
});
