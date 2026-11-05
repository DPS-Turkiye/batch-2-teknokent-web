import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { UserRole, type AppSession } from "@/interfaces/session";
import { InLocale } from "@test/test-utils";

let session: AppSession | null = null;
let isLoading = false;
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session, isLoading }),
}));

beforeEach(() => {
  session = null;
  isLoading = false;
});

describe("usePublicSessionDestination", () => {
  it.each([
    ["tr", "Kayıt Ol"],
    ["en", "Sign up"],
  ] as const)(
    "offers unfiltered signup in %s to signed-out visitors",
    (locale, label) => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <InLocale locale={locale}>{children}</InLocale>
      );
      const { result } = renderHook(() => usePublicSessionDestination(), {
        wrapper,
      });
      expect(result.current.href).toBe("/login");
      expect(result.current.signup).toEqual({ href: "/signup", label });
    },
  );

  it("waits for session resolution before offering registration", () => {
    isLoading = true;
    const { result, rerender } = renderHook(() =>
      usePublicSessionDestination(),
    );
    expect(result.current.signup).toBeNull();
    isLoading = false;
    rerender();
    expect(result.current.signup?.href).toBe("/signup");
  });

  it.each([
    [UserRole.Mentee, "/dashboard"],
    [UserRole.Mentor, "/mentor-dashboard"],
    [UserRole.Admin, "/admin"],
    [UserRole.Coordinator, "/coordinator"],
  ])("keeps a signed-in %s on their workspace path", (role, href) => {
    session = {
      userId: "user",
      email: "user@example.com",
      fullName: "Example User",
      jobTitle: "",
      role,
    };
    const { result } = renderHook(() => usePublicSessionDestination());
    expect(result.current.href).toBe(href);
    expect(result.current.signup).toBeNull();
  });
});
