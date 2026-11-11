import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePersonProfileHref } from "@/hooks/use-person-profile-href";

const navigation = vi.hoisted(() => ({ pathname: "/admin/users/mentors" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("usePersonProfileHref", () => {
  it("links admins to the admin page and coordinators to theirs", () => {
    navigation.pathname = "/admin/users/mentors";
    const admin = renderHook(() => usePersonProfileHref());
    expect(admin.result.current("u1")).toBe("/admin/users/u1");

    navigation.pathname = "/coordinator/programs/p/mentors";
    const coordinator = renderHook(() => usePersonProfileHref());
    expect(coordinator.result.current("u1")).toBe("/coordinator/people/u1");
  });
});
