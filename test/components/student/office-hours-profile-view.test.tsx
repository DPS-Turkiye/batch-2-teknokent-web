import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OfficeHoursProfileView } from "@/components/student/office-hours-profile-view";
import { AppointmentKind } from "@/interfaces/appointment";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { peerAppointment } from "@test/fixtures/student-appointments";
import { STUDENT_RECORD } from "@test/fixtures/student-home";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));
vi.mock(
  "@/lib/client/student-office-hours",
  async () => await import("@test/fixtures/student-office-hours-client"),
);
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 8));
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue([
      peerAppointment({
        id: "past-office-hours",
        kind: AppointmentKind.OfficeHours,
        category: null,
        topic: "Araştırma projesi tanışma",
        counterpart: {
          userId: "sample-academician-kaya",
          fullName: "Ahmet Kaya",
          title: "Prof. Dr.",
          department: null,
        },
        startsAt: "2026-10-14T08:00:00.000Z",
        endsAt: "2026-10-14T08:30:00.000Z",
      }),
    ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OfficeHoursProfileView", () => {
  it("shows who they are, what they cover and how to book", async () => {
    renderWithQueryClient(
      <OfficeHoursProfileView academicianId="sample-academician-kaya" />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Prof. Dr. Ahmet Kaya",
      }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Hakkında" })).toBeVisible();
    expect(
      within(
        screen.getByRole("region", {
          name: "Hangi konularda görüşebilirsiniz?",
        }),
      ).getByText("Lisansüstü başvuru"),
    ).toBeVisible();
    expect(screen.getByText("CENG 462")).toBeVisible();
    expect(screen.getByText("30 dakika")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Randevu Talep Et" }),
    ).toHaveAttribute(
      "href",
      "/student/office-hours/sample-academician-kaya/book",
    );
  });

  it("lists this week's free times and the earlier sessions with them", async () => {
    renderWithQueryClient(
      <OfficeHoursProfileView academicianId="sample-academician-kaya" />,
    );
    const week = await screen.findByRole("region", {
      name: "Bu hafta müsait saatler",
    });
    expect(await within(week).findAllByRole("listitem")).not.toHaveLength(0);
    expect(await screen.findByText("Araştırma projesi tanışma")).toBeVisible();
  });

  it("lists earlier sessions with the advisor sent from the advisor's own page", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue(STUDENT_RECORD);
    vi.mocked(getStudentAppointments).mockResolvedValue([
      peerAppointment({
        id: "advisor-past",
        kind: AppointmentKind.OfficeHours,
        category: null,
        topic: "Ders seçimi",
        counterpart: {
          userId: "advisor",
          fullName: "Elif Şahin",
          title: "Doç. Dr.",
          department: null,
        },
        startsAt: "2026-10-20T08:00:00.000Z",
        endsAt: "2026-10-20T08:30:00.000Z",
      }),
    ]);
    renderWithQueryClient(<OfficeHoursProfileView academicianId="advisor" />);
    expect(await screen.findByText("Ders seçimi")).toBeVisible();
  });

  it("says so for an unknown academician", async () => {
    renderWithQueryClient(<OfficeHoursProfileView academicianId="nobody" />);
    expect(await screen.findByText("Bu akademisyen bulunamadı.")).toBeVisible();
  });
});
