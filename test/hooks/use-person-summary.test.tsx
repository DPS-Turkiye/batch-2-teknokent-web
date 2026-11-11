import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePersonProfileHref } from "@/hooks/use-person-profile-href";
import { usePersonSummary } from "@/hooks/use-person-summary";
import { getPersonSummary } from "@/lib/client/person-summary";
import { mentorSummary } from "@test/fixtures/person-summary";
import { createTestQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({
  pathname: "/admin/users/mentor-1",
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ back: navigation.back, push: navigation.push }),
}));

vi.mock("@/lib/client/person-summary", () => ({ getPersonSummary: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("usePersonSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPersonSummary).mockResolvedValue(mentorSummary());
  });
  afterEach(() => vi.restoreAllMocks());

  it("loads the summary and keeps admins in the admin frame", async () => {
    navigation.pathname = "/admin/users/mentor-1";
    const { result } = renderHook(() => usePersonSummary("mentor-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.summary?.id).toBe("mentor-1"));
    expect(result.current.listHref).toBe("/admin/users");
    expect(result.current.programHref("p 1")).toBe("/admin/programs/p%201");
  });

  it("keeps coordinators in their frame", () => {
    navigation.pathname = "/coordinator/people/mentor-1";
    const { result } = renderHook(() => usePersonSummary("mentor-1"), {
      wrapper,
    });

    expect(result.current.listHref).toBe("/coordinator/programs");
    expect(result.current.programHref("p")).toBe("/coordinator/programs/p");
  });

  it("goes back when there is a page to go back to, else to the list", () => {
    navigation.pathname = "/admin/users/mentor-1";
    const length = vi.spyOn(window.history, "length", "get");
    const { result } = renderHook(() => usePersonSummary("mentor-1"), {
      wrapper,
    });

    length.mockReturnValue(3);
    act(() => result.current.goBack());
    expect(navigation.back).toHaveBeenCalledTimes(1);

    length.mockReturnValue(1);
    act(() => result.current.goBack());
    expect(navigation.push).toHaveBeenCalledWith("/admin/users");
  });
});

describe("usePersonProfileHref", () => {
  it("links admins to the admin page and coordinators to theirs", () => {
    navigation.pathname = "/admin/users/mentors";
    const admin = renderHook(() => usePersonProfileHref());
    expect(admin.result.current("u/1")).toBe("/admin/users/u%2F1");

    navigation.pathname = "/coordinator/programs/p/mentors";
    const coordinator = renderHook(() => usePersonProfileHref());
    expect(coordinator.result.current("u1")).toBe("/coordinator/people/u1");
  });
});
