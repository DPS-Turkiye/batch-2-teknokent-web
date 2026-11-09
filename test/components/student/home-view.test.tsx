import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHomeView } from "@/components/student/home-view";
import {
  studentRouteReady,
  studentRouteSoon,
} from "@/components/student/student-frame";
import { useStudentHome } from "@/hooks/use-student-home";
import type { StudentHome } from "@/interfaces/student-home";
import { getStudentHome } from "@/lib/client/student-home";
import { STUDENT_HOME_FIXTURE } from "@/lib/client/fixtures/student-home";
import { EMPTY_PROFILE_COMPLETION } from "@/lib/client/fixtures/student-profile-completion";
import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-student-home", () => ({ useStudentHome: vi.fn() }));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
}));

function homeReturns(data: StudentHome | undefined, extra = {}) {
  vi.mocked(useStudentHome).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    ...extra,
  } as ReturnType<typeof useStudentHome>);
}

describe("StudentHomeView", () => {
  beforeEach(() => homeReturns(STUDENT_HOME_FIXTURE));

  it("lists upcoming appointments with their side and status", () => {
    renderWithQueryClient(<StudentHomeView />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Staj başvurusu için CV")).toBeVisible();
    expect(within(rows[0]).getByText("Mentee olarak")).toBeVisible();
    expect(within(rows[0]).getByText("Onaylandı")).toBeVisible();
    expect(
      within(rows[1]).getByText(/Dr\. Öğr\. Üyesi Ayşe Demir/),
    ).toBeVisible();
    expect(within(rows[1]).getByText("Office Hours")).toBeVisible();
    expect(within(rows[1]).getByText("Onay Bekliyor")).toBeVisible();
    expect(within(rows[2]).getByText("Mentor olarak")).toBeVisible();
    expect(within(rows[2]).getByText("Alternatif Önerildi")).toBeVisible();
  });

  it("asks for the profile until it is completed or skipped", () => {
    const { unmount } = renderWithQueryClient(<StudentHomeView />);
    expect(screen.getByText("Profilini tamamla")).toBeVisible();
    unmount();

    homeReturns({ ...STUDENT_HOME_FIXTURE, profileCompleted: true });
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

describe("getStudentHome", () => {
  it("asks for profile completion until the saved profile is finished or skipped", async () => {
    vi.mocked(getStudentProfileCompletion).mockResolvedValue(
      EMPTY_PROFILE_COMPLETION,
    );
    expect((await getStudentHome()).profileCompleted).toBe(false);
    vi.mocked(getStudentProfileCompletion).mockResolvedValue({
      ...EMPTY_PROFILE_COMPLETION,
      skipped: true,
    });
    expect((await getStudentHome()).profileCompleted).toBe(true);
  });

  it("answers with a fresh copy of the fixture", async () => {
    vi.mocked(getStudentProfileCompletion).mockResolvedValue(
      EMPTY_PROFILE_COMPLETION,
    );
    const first = await getStudentHome();
    first.upcomingAppointments.length = 0;
    expect((await getStudentHome()).upcomingAppointments).toHaveLength(3);
  });
});
