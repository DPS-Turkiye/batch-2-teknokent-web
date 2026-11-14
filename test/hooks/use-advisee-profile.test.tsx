import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdviseeProfile } from "@/hooks/use-institution-record";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { fetchAdviseeProfile } from "@/lib/client/institution";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchAdviseeProfile: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
  fetchInstitutionRecord: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useAdviseeProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the advisee's interests and goal", async () => {
    const profile = {
      interests: {
        topics: [PeerTopicCategory.CareerInternship],
        subtopics: ["cv"],
      },
      goal: "Yaz stajı bulmak",
    };
    vi.mocked(fetchAdviseeProfile).mockResolvedValue(profile);

    const { result } = renderHook(() => useAdviseeProfile("student-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(fetchAdviseeProfile).toHaveBeenCalledWith("student-1");
  });

  it("asks nothing for a student who has never signed in", () => {
    const { result } = renderHook(() => useAdviseeProfile(null), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(fetchAdviseeProfile).not.toHaveBeenCalled();
  });
});
