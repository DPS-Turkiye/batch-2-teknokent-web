import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  profileAnalysisQueryKey,
  useProfileAnalysis,
  useUploadProfileAnalysis,
} from "@/hooks/use-profile-analysis";
import {
  ProfileAnalysisStatus,
  ProfileAnalysisType,
  ProfileOcrMode,
} from "@/interfaces/profile-analysis";
import {
  getLatestProfileAnalysis,
  uploadProfileAnalysis,
} from "@/lib/client/profile-analysis";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/profile-analysis", () => ({
  getLatestProfileAnalysis: vi.fn(),
  uploadProfileAnalysis: vi.fn(),
  createManualProfile: vi.fn(),
  confirmProfile: vi.fn(),
}));

function wrapperFor(queryClient: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useProfileAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses a self-scoped query key when no appUserId is given", async () => {
    vi.mocked(getLatestProfileAnalysis).mockResolvedValue(null);
    const queryClient = createTestQueryClient();

    renderHook(() => useProfileAnalysis(), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() =>
      expect(getLatestProfileAnalysis).toHaveBeenCalledWith(undefined),
    );
    expect(queryClient.getQueryState(profileAnalysisQueryKey())).toBeDefined();
  });

  it("keys the query per appUserId so switching targets doesn't share cache", async () => {
    vi.mocked(getLatestProfileAnalysis).mockResolvedValue(null);
    const queryClient = createTestQueryClient();

    const signedInUser: { appUserId: string | undefined } = {
      appUserId: undefined,
    };
    const { result, rerender } = renderHook(
      ({ appUserId }) => useProfileAnalysis(appUserId),
      { wrapper: wrapperFor(queryClient), initialProps: signedInUser },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ appUserId: "member-1" });
    await waitFor(() =>
      expect(getLatestProfileAnalysis).toHaveBeenCalledWith("member-1"),
    );

    expect(profileAnalysisQueryKey()).not.toEqual(
      profileAnalysisQueryKey("member-1"),
    );
  });

  it("caches an uploaded profile under the target it was uploaded for", async () => {
    const analysis = {
      id: "analysis-1",
      appUserId: "member-1",
      sourceFilename: "cv.pdf",
      profileType: ProfileAnalysisType.Personal,
      profile: {},
      status: ProfileAnalysisStatus.Draft,
      createdAt: "2026-08-26T00:00:00Z",
    };
    vi.mocked(uploadProfileAnalysis).mockResolvedValue(analysis);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUploadProfileAnalysis(), {
      wrapper: wrapperFor(queryClient),
    });

    await result.current.mutateAsync({
      file: new File(["x"], "cv.pdf"),
      ocrMode: ProfileOcrMode.Auto,
      profileType: ProfileAnalysisType.Personal,
      consentAccepted: true,
      appUserId: "member-1",
    });

    expect(
      queryClient.getQueryData(profileAnalysisQueryKey("member-1")),
    ).toEqual(analysis);
    expect(queryClient.getQueryData(profileAnalysisQueryKey())).toBeUndefined();
  });
});
