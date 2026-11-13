import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianFrame } from "@/components/academician/academician-frame";
import { StudentFrame } from "@/components/student/student-frame";
import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { itemAt } from "@test/fixtures/list-assertions";

const replace = vi.fn();
let pathname = "/student";
const odtuStudent: AppSession = {
  userId: "u1",
  fullName: "Ayşe Yılmaz",
  email: "ayse.yilmaz@odtu-dev.invalid",
  role: UserRole.Mentee,
  jobTitle: "",
  permissions: [UserRole.Mentee],
  institutionKinds: [IdentityKind.Student],
  edition: Edition.Odtu,
};
const teknokentMentee: AppSession = {
  userId: "u2",
  fullName: "Kurucu",
  email: "kurucu@example.com",
  role: UserRole.Mentee,
  jobTitle: "",
  organizationId: "org-1",
  permissions: [UserRole.Mentee],
};
const researchAssistant: AppSession = {
  userId: "u3",
  fullName: "Elif Şahin",
  email: "elif.sahin@odtu-dev.invalid",
  role: UserRole.Academician,
  jobTitle: "",
  permissions: [UserRole.Mentee, UserRole.Academician],
  institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
  edition: Edition.Odtu,
};
let session: AppSession = odtuStudent;
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
  useSession: () => ({ session, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));
// The tour has its own tests (test/components/product-tour); here it would only open over the menus.
vi.mock("@/components/product-tour/product-tour", () => ({
  ProductTour: () => null,
}));

function desktopNav(name: string) {
  return itemAt(screen.getAllByRole("navigation", { name }), 0);
}

beforeEach(() => {
  session = odtuStudent;
  replace.mockClear();
});

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
    const officeHours = within(nav).getByRole("link", {
      name: "Office Hours",
    });
    expect(officeHours).toHaveAttribute("href", "/student/office-hours");
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

  it("opens for an ODTÜ student", () => {
    render(<StudentFrame>x</StudentFrame>);
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a Teknokent mentee to their own home instead", () => {
    session = teknokentMentee;
    render(<StudentFrame>İçerik</StudentFrame>);
    expect(screen.queryByText("İçerik")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("opens for a research assistant, who is a student too", () => {
    session = researchAssistant;
    render(<StudentFrame>İçerik</StudentFrame>);
    expect(screen.getByText("İçerik")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

const ACADEMICIAN_SCREENS_BUILT = [
  "Randevularım",
  "Danışan Öğrencilerim",
  "Profilim",
];
// The IA redesign folds Talepler and Takvim into Randevularım.
const ACADEMICIAN_SCREENS_GONE = ["Randevu Talepleri", "Takvim"];

describe("AcademicianFrame", () => {
  it("does not open for a student who is not an academician", () => {
    pathname = "/academician";
    render(<AcademicianFrame>İçerik</AcademicianFrame>);
    expect(screen.queryByText("İçerik")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/student");
  });

  it("shows the academician menu with the screens built so far", () => {
    session = researchAssistant;
    pathname = "/academician";
    render(<AcademicianFrame>x</AcademicianFrame>);
    const nav = desktopNav("Akademisyen menüsü");
    expect(within(nav).getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const label of ACADEMICIAN_SCREENS_BUILT) {
      expect(within(nav).getByRole("link", { name: label })).toBeVisible();
    }
    for (const label of ACADEMICIAN_SCREENS_GONE) {
      expect(within(nav).queryByRole("link", { name: label })).toBeNull();
    }
    expect(screen.getByText("Akademisyen")).toBeInTheDocument();
  });
});
