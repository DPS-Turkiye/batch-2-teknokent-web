import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianFrame } from "@/components/academician/academician-frame";
import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

let pathname = "/academician";
const academician: AppSession = {
  userId: "u-1",
  email: "elif@odtu-dev.invalid",
  fullName: "Elif Şahin",
  jobTitle: "Akademisyen",
  role: UserRole.Academician,
  permissions: [UserRole.Academician],
  institutionKinds: [IdentityKind.Academic],
  // The academician workspace exists only in the ODTÜ deployment.
  edition: Edition.Odtu,
};
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  SESSION_QUERY_KEY: ["session"],
  useAppSession: () => academician,
  useSession: () => ({
    session: academician,
    isLoading: false,
    logout: vi.fn(),
  }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));

beforeEach(() => {
  pathname = "/academician";
});

function nav() {
  return screen.getAllByRole("navigation")[0] ?? screen.getByRole("navigation");
}

describe("AcademicianFrame", () => {
  it("has the four IA tabs in order", () => {
    renderWithQueryClient(
      <AcademicianFrame>
        <p>Ana Sayfa</p>
      </AcademicianFrame>,
    );
    expect(
      within(nav())
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Anasayfa", "/academician"],
      ["Randevularım", "/academician/appointments"],
      ["Danışan Öğrencilerim", "/academician/advisees"],
      ["Profilim", "/academician/profile"],
    ]);
  });

  it.each([
    "/academician/appointments/availability",
    "/academician/students/sample-student-deniz",
  ])("keeps Randevularım selected on %s", (path) => {
    pathname = path;
    renderWithQueryClient(
      <AcademicianFrame>
        <p>Alt sayfa</p>
      </AcademicianFrame>,
    );
    expect(
      within(nav()).getByRole("link", { name: "Randevularım" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
