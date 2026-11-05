import { renderHook } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useProgramNavigation } from "@/hooks/use-program-navigation";
vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
describe("program navigation", () => {
  it("keeps admins in the admin workspace", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/p");
    const { result } = renderHook(() => useProgramNavigation("p"));
    expect(result.current.baseHref).toBe("/admin/programs/p");
    expect(result.current.resolveHref("/coordinator/programs/p/settings")).toBe(
      "/admin/programs/p/settings",
    );
    expect(result.current.resolveHref("/coordinator/mentorships")).toBe(
      "/admin/mentorships",
    );
    expect(result.current.listHref).toBe("/admin/programs");
  });
  it("preserves coordinator navigation", () => {
    vi.mocked(usePathname).mockReturnValue("/coordinator/programs/p");
    const { result } = renderHook(() => useProgramNavigation("p"));
    expect(result.current.baseHref).toBe("/coordinator/programs/p");
    expect(result.current.resolveHref("/coordinator/mentorships")).toBe(
      "/coordinator/mentorships",
    );
    expect(result.current.admin).toBe(false);
  });
});
