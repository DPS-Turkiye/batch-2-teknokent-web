import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHomeView } from "@/components/student/home-view";
import { useStudentHome } from "@/hooks/use-student-home";
import { AppointmentKind, AppointmentStatus } from "@/interfaces/appointment";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  PEER_MENTORS_FIXTURE,
  peerMentoringRequestsFixture,
} from "@test/fixtures/peer-mentoring";
import { peerAppointment } from "@test/fixtures/student-appointments";
import { studentHomeModel } from "@test/fixtures/student-home";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-student-home", () => ({ useStudentHome: vi.fn() }));
vi.mock("@/components/student/peer-mentor-request-dialog", () => ({
  PeerMentorRequestDialog: ({ mentor }: { mentor: { fullName: string } }) => (
    <div role="dialog" aria-label={mentor.fullName} />
  ),
}));

const officeHours = peerAppointment({
  id: "oh-1",
  requestId: null,
  kind: AppointmentKind.OfficeHours,
  category: null,
  topic: "Ders seçimi ve staj planı",
  counterpart: {
    userId: "academician-1",
    fullName: "Elif Şahin",
    title: "Doç. Dr.",
    department: "Endüstri Mühendisliği",
  },
});
const alternative = peerAppointment({
  id: "oh-2",
  requestId: null,
  kind: AppointmentKind.OfficeHours,
  category: null,
  status: AppointmentStatus.AlternativeProposed,
  counterpart: {
    userId: "academician-2",
    fullName: "Ahmet Kaya",
    title: "Prof. Dr.",
    department: null,
  },
});

function homeReturns(overrides: Parameters<typeof studentHomeModel>[0] = {}) {
  vi.mocked(useStudentHome).mockReturnValue(studentHomeModel(overrides));
}

describe("StudentHomeView", () => {
  beforeEach(() => homeReturns());

  it("greets the student by name", () => {
    renderWithQueryClient(<StudentHomeView />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Günaydın, Ayşe" }),
    ).toBeVisible();
  });

  it("greets without a name when the record has none", () => {
    homeReturns({ name: null });
    renderWithQueryClient(<StudentHomeView />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Günaydın" }),
    ).toBeVisible();
  });

  it("puts the next session in the banner with its status and a link to Randevularım", () => {
    homeReturns({ next: officeHours, upcoming: [officeHours] });
    renderWithQueryClient(<StudentHomeView />);

    const banner = screen.getByRole("region", { name: "Sıradaki randevu" });
    expect(within(banner).getByText("Ders seçimi ve staj planı")).toBeVisible();
    expect(within(banner).getByText("Onaylandı")).toBeVisible();
    expect(
      within(banner).getByRole("link", { name: "Randevuyu Gör" }),
    ).toHaveAttribute("href", "/student/appointments");
  });

  it("lists the upcoming sessions as dated cards", () => {
    homeReturns({ upcoming: [officeHours] });
    renderWithQueryClient(<StudentHomeView />);

    const list = screen.getByRole("region", { name: "Yaklaşan randevularım" });
    const row = within(list).getByRole("link", { name: /Doç\. Dr\. Elif Şahin/ });
    expect(row).toHaveAttribute("href", "/student/appointments");
    expect(within(row).getByText(/Office Hours/)).toBeVisible();
  });

  it("says so when nothing is ahead", () => {
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.getByText("Yaklaşan randevun yok.")).toBeVisible();
    expect(screen.getByText("Yanıt bekleyen talebin yok.")).toBeVisible();
  });

  it("offers the four quick actions with the appointment counts", () => {
    homeReturns({ confirmedCount: 2, requestCount: 1 });
    renderWithQueryClient(<StudentHomeView />);

    const quick = screen.getByRole("navigation", { name: "Hızlı işlemler" });
    expect(
      within(quick)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/student/office-hours",
      "/student/peer-mentoring",
      "/student/appointments",
      "/student/profile",
    ]);
    expect(within(quick).getByText("2 yaklaşan · 1 talep")).toBeVisible();
  });

  it("shows the advisor with a way to ask for Office Hours", () => {
    renderWithQueryClient(<StudentHomeView />);
    const advisor = screen.getByRole("region", { name: "Doç. Dr. Elif Şahin" });
    expect(
      within(advisor).getByRole("link", { name: "Randevu Talep Et" }),
    ).toHaveAttribute("href", "/student/office-hours");
  });

  it("hides the advisor card without an advisor", () => {
    homeReturns({ advisor: null });
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.queryByText("Akademik danışmanın")).not.toBeInTheDocument();
  });

  it("lists waiting requests and asks for a reply to an alternative time", () => {
    const request = itemAt(peerMentoringRequestsFixture(), 0);
    homeReturns({
      awaiting: [alternative],
      peerRequests: [request],
      requestCount: 2,
    });
    renderWithQueryClient(<StudentHomeView />);

    const pending = screen.getByRole("region", { name: "Bekleyen taleplerim" });
    expect(
      within(pending).getByRole("link", { name: "Tümü (2)" }),
    ).toBeVisible();
    expect(within(pending).getByText("Alternatif Önerildi")).toBeVisible();
    expect(within(pending).getByRole("link", { name: "Yanıtla" })).toBeVisible();
    expect(within(pending).getByText(request.mentor.fullName)).toBeVisible();
    expect(within(pending).getByText("Yanıt Bekliyor")).toBeVisible();
  });

  it("recommends mentors with their reasons and opens the request dialog", async () => {
    const mentor = itemAt(PEER_MENTORS_FIXTURE, 0);
    homeReturns({ mentors: [mentor] });
    renderWithQueryClient(<StudentHomeView />);

    const section = screen.getByRole("region", {
      name: "Sana önerilen mentorlar",
    });
    expect(within(section).getByText("Neden önerildi?")).toBeVisible();
    for (const reason of mentor.recommendationReasons) {
      expect(within(section).getByText(reason)).toBeVisible();
    }

    await userEvent.click(
      within(section).getByRole("button", { name: "Mentorluk Talebi Gönder" }),
    );
    expect(screen.getByRole("dialog", { name: mentor.fullName })).toBeVisible();
  });

  it("renders the extra blocks another edition adds", () => {
    renderWithQueryClient(
      <StudentHomeView main={<p>Ana blok</p>} aside={<p>Yan blok</p>} />,
    );
    expect(screen.getByText("Ana blok")).toBeVisible();
    expect(screen.getByText("Yan blok")).toBeVisible();
  });

  it("shows only the loading note until the data is in", () => {
    homeReturns({ ready: false, isLoading: true, greeting: null });
    renderWithQueryClient(<StudentHomeView />);
    expect(screen.getByText("Yükleniyor…")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Hızlı işlemler" }),
    ).not.toBeInTheDocument();
  });
});
