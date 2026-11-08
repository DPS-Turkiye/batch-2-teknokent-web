import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AcademicianFrame } from "@/components/academician/academician-frame";
import { StudentFrame } from "@/components/student/student-frame";
import { UserRole } from "@/interfaces/session";

const replace = vi.fn();
let pathname = "/student";
const mentee = {
  userId: "u1",
  fullName: "Ayşe Yılmaz",
  email: "ayse@metu.edu.tr",
  role: UserRole.Mentee,
  jobTitle: "",
};
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mentee,
  useSession: () => ({ session: mentee, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));

function desktopNav(name: string) {
  return screen.getAllByRole("navigation", { name })[0];
}

describe("StudentFrame", () => {
  it("shows the student menu with the screens that have landed open", () => {
    pathname = "/student";
    render(
      <StudentFrame>
        <p>Ana içerik</p>
      </StudentFrame>,
    );
    const nav = desktopNav("Öğrenci menüsü");
    expect(within(nav).getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: "Akran Mentörlüğü" }),
    ).toHaveAttribute("href", "/student/peer-mentoring");
    expect(within(nav).getByRole("link", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/student/profile",
    );
    for (const label of ["Office Hours"]) {
      expect(within(nav).queryByRole("link", { name: label })).toBeNull();
      expect(
        within(nav).getByText(label).closest("[aria-disabled]"),
      ).not.toBeNull();
    }
    expect(
      within(nav).getByRole("link", { name: "Randevularım" }),
    ).toHaveAttribute("href", "/student/appointments");
    expect(screen.getByText("Ana içerik")).toBeInTheDocument();
  });

  it("names the workspace, not the account's role, under the user's name", () => {
    render(<StudentFrame>x</StudentFrame>);
    expect(screen.getByText("Öğrenci")).toBeInTheDocument();
    expect(screen.queryByText("Girişim Ekibi")).toBeNull();
  });

  it("lets any signed-in account in while it runs on fixtures", () => {
    replace.mockClear();
    render(<StudentFrame>x</StudentFrame>);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("AcademicianFrame", () => {
  it("shows the academician menu with only the home screen open so far", () => {
    pathname = "/academician";
    render(<AcademicianFrame>x</AcademicianFrame>);
    const nav = desktopNav("Akademisyen menüsü");
    expect(within(nav).getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const label of [
      "Randevu Talepleri",
      "Randevularım",
      "Takvim",
      "Danışan Öğrencilerim",
      "Profilim",
    ]) {
      expect(within(nav).queryByRole("link", { name: label })).toBeNull();
    }
    expect(screen.getByText("Akademisyen")).toBeInTheDocument();
  });
});
