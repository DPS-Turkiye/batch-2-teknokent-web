import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
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
  it("sends a signed-in ODTÜ student to their workspace, not the startup dashboard", () => {
    session = {
      userId: "s-1",
      email: "ayse@metu.edu.tr",
      fullName: "Ayşe Yılmaz",
      jobTitle: "",
      role: UserRole.Mentee,
      institutionKinds: [IdentityKind.Student],
      edition: Edition.Odtu,
    };
    const { result } = renderHook(() => usePublicSessionDestination());

    expect(result.current.href).toBe("/student");
    expect(result.current.primaryAction.href).toBe("/student");
  });

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
      expect(result.current.primaryAction).toEqual({ href: "/signup", label });
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

  it("does not send the primary signup action to login during session loading", () => {
    isLoading = true;
    const { result } = renderHook(() => usePublicSessionDestination());
    expect(result.current.primaryAction).toEqual({
      href: "/signup",
      label: "Kayıt Ol",
    });
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
    expect(result.current.primaryAction).toEqual({
      href,
      label: "Example olarak devam et",
    });
  });
});
