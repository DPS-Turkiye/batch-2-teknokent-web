import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorPage, useStartupContext } from "@/hooks/use-mentor-pages";
import { loadMentorPage, loadMentorSlots } from "@/lib/client/mentor-pages";
import { loadStartupContext } from "@/lib/client/startup-context";
import tr from "@/messages/tr.json";
import { mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/client/mentor-pages", () => ({
  loadMentorPage: vi.fn(),
  loadMentorSlots: vi.fn(),
}));
vi.mock("@/lib/client/startup-context", () => ({
  loadStartupContext: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe("useMentorPage", () => {
  it("loads the mentor the caller may see and their open times", async () => {
    const slot = {
      id: "s-1",
      startsAt: "2099-01-05T10:00:00Z",
      durationMinutes: 30,
      booked: false,
    };
    vi.mocked(loadMentorPage).mockResolvedValue({
      mentor: mentorProfile,
      viewOnlyPrograms: null,
    });
    vi.mocked(loadMentorSlots).mockResolvedValue([slot]);

    const { result } = renderHook(() => useMentorPage("m-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page?.mentor).toEqual(mentorProfile);
    expect(result.current.slots).toEqual([slot]);
    expect(loadMentorPage).toHaveBeenCalledWith("m-1");
  });

  it("answers no page for a mentor the caller may not see", async () => {
    vi.mocked(loadMentorPage).mockResolvedValue(null);
    vi.mocked(loadMentorSlots).mockResolvedValue([]);

    const { result } = renderHook(() => useMentorPage("m-2"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBeNull();
  });
});

describe("useStartupContext", () => {
  it("loads nothing without a startup", () => {
    const { result } = renderHook(() => useStartupContext(undefined), {
      wrapper,
    });

    expect(result.current).toEqual({
      isLoading: false,
      startup: null,
      error: undefined,
    });
    expect(loadStartupContext).not.toHaveBeenCalled();
  });

  it("loads the caller's startup, named in the reader's language when it fails", async () => {
    const startup = {
      organizationId: "org-1",
      name: "Kargo AI",
      summary: "",
      sector: "",
      stage: "",
      technologies: [],
      confirmedProfile: false,
    };
    vi.mocked(loadStartupContext).mockResolvedValue({ startup });

    const { result } = renderHook(() => useStartupContext("org-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.startup).toEqual(startup));
    expect(loadStartupContext).toHaveBeenCalledWith(
      "org-1",
      tr.loadErrors.startupFallbackName,
    );
  });
});
