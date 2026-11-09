import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHomeView } from "@/components/student/home-view";
import {
  studentRouteReady,
  studentRouteSoon,
} from "@/components/student/student-frame";
import { useStudentHome } from "@/hooks/use-student-home";
import type { StudentHome } from "@/interfaces/student-home";
import { STUDENT_APPOINTMENTS } from "@test/fixtures/student-appointments";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-student-home", () => ({ useStudentHome: vi.fn() }));
function homeReturns(data: StudentHome | undefined, extra = {}) {
  vi.mocked(useStudentHome).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    ...extra,
  } as ReturnType<typeof useStudentHome>);
}

const HOME: StudentHome = {
  profileCompleted: false,
  upcomingAppointments: [STUDENT_APPOINTMENTS[1], STUDENT_APPOINTMENTS[0]],
};

describe("StudentHomeView", () => {
  beforeEach(() => homeReturns(HOME));

  it("shows the upcoming sessions as cards with their side and status", () => {
    renderWithQueryClient(<StudentHomeView />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Uluslararası Fırsatlar")).toBeVisible();
    expect(within(rows[0]).getByText("Mentor olarak")).toBeVisible();
    expect(within(rows[1]).getByText("Kariyer ve Staj")).toBeVisible();
    expect(within(rows[1]).getByText("Mentee olarak")).toBeVisible();
    expect(within(rows[1]).getByText("Onaylandı")).toBeVisible();
  });

  it("asks for the profile until it is completed or skipped", () => {
    const { unmount } = renderWithQueryClient(<StudentHomeView />);
    expect(screen.getByText("Profilini tamamla")).toBeVisible();
    unmount();

    homeReturns({ ...HOME, profileCompleted: true });
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.queryByText("Profilini tamamla")).not.toBeInTheDocument();
  });

  it("shows an empty note without appointments", () => {
    homeReturns({ profileCompleted: true, upcomingAppointments: [] });
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.getByText("Yaklaşan randevun yok.")).toBeVisible();
  });

  it("links to every section, marking Office Hours as Yakında", () => {
    renderWithQueryClient(<StudentHomeView />);

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/student/profile/complete",
      "/student/appointments",
      "https://meet.google.com/abc-defg-hij",
      "/student/peer-mentoring",
      "/student/office-hours",
    ]);
    expect(
      within(screen.getByRole("link", { name: /^Office Hours/ })).getByText(
        "Yakında",
      ),
    ).toBeVisible();
  });

  it("shows nothing but the query state while loading", () => {
    homeReturns(undefined, { isLoading: true });
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentHomeView />
      </InLocale>,
    );
    expect(screen.getByRole("heading", { name: "Home" })).toBeVisible();
    expect(screen.getByText("Upcoming appointments")).toBeVisible();
    expect(screen.getByText("As mentee")).toBeVisible();
  });
});

describe("studentRouteReady", () => {
  it("follows the student nav switch", () => {
    expect(studentRouteReady("/student")).toBe(true);
    expect(studentRouteReady("/student/appointments")).toBe(true);
    expect(studentRouteReady("/student/profile/complete")).toBe(true);
    expect(studentRouteReady("/elsewhere")).toBe(false);
  });

  it("opens Office Hours as a Yakında page and nothing else", () => {
    expect(studentRouteReady("/student/office-hours")).toBe(true);
    expect(studentRouteSoon("/student/office-hours")).toBe(true);
    expect(studentRouteSoon("/student/appointments")).toBe(false);
    expect(studentRouteSoon("/elsewhere")).toBe(false);
  });
});
