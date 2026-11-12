import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OfficeHoursBookingView } from "@/components/student/office-hours-booking-view";
import { AppointmentStatus } from "@/interfaces/appointment";
import { resetStudentOfficeHoursSample } from "@/lib/client/fixtures/student-office-hours-store";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { getStudentOfficeHoursAppointments } from "@/lib/client/student-office-hours";
import { STUDENT_RECORD } from "@test/fixtures/student-home";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
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
  // Monday 9 November 2026, 08:00: the sample week is all ahead.
  vi.setSystemTime(new Date(2026, 10, 9, 8));
  vi.mocked(fetchInstitutionRecord)
    .mockReset()
    .mockResolvedValue(STUDENT_RECORD);
  push.mockReset();
  resetStudentOfficeHoursSample();
});

afterEach(() => {
  vi.useRealTimers();
});

async function pickFirstFreeTime() {
  const times = await screen.findByRole("group", { name: "Saatler" });
  const free = within(times)
    .getAllByRole("button")
    .find((button) => !button.hasAttribute("disabled"));
  expect(free).toBeDefined();
  if (free) await userEvent.click(free);
}

describe("OfficeHoursBookingView", () => {
  it("shows the academician and the week's days with their free counts", async () => {
    renderWithQueryClient(
      <OfficeHoursBookingView academicianId="sample-academician-kaya" />,
    );
    expect(
      await screen.findByRole("heading", { name: "Prof. Dr. Ahmet Kaya" }),
    ).toBeVisible();
    const days = await screen.findByRole("group", { name: "Günler" });
    expect(within(days).getAllByRole("button")).toHaveLength(5);
    expect(within(days).getByRole("button", { name: /Pzt/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Devam Et" })).toBeDisabled();
  });

  it("asks for both fields before sending (Konu boş)", async () => {
    const { container } = renderWithQueryClient(
      <OfficeHoursBookingView academicianId="sample-academician-kaya" />,
    );
    await pickFirstFreeTime();
    expect(
      container.querySelector('[data-tour="office-hours-continue"]'),
    ).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Devam Et" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Randevu talep et")).toBeVisible();
    expect(
      dialog.querySelector('[data-tour="appointment-request-submit"]'),
    ).not.toBeNull();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Randevu Talebi Gönder" }),
    );
    expect(within(dialog).getByText("Görüşme başlığını yaz.")).toBeVisible();
    expect(
      within(dialog).getByText("Görüşmek istediğin konuyu kısaca anlat."),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it("sends the request and opens Randevularım with the sent banner", async () => {
    renderWithQueryClient(
      <OfficeHoursBookingView academicianId="sample-academician-kaya" />,
    );
    await pickFirstFreeTime();
    await userEvent.click(screen.getByRole("button", { name: "Devam Et" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText(/Görüşme başlığı/),
      "CV ve yüksek lisans seçenekleri",
    );
    await userEvent.type(
      within(dialog).getByLabelText(/Açıklama/),
      "Staj başvurusu için CV'mi değerlendirmek istiyorum.",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Randevu Talebi Gönder" }),
    );

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/student/appointments?sent=${encodeURIComponent("Prof. Dr. Ahmet Kaya")}`,
      ),
    );
    const sent = (await getStudentOfficeHoursAppointments()).filter(
      (item) => item.status === AppointmentStatus.Pending,
    );
    expect(sent.map((item) => item.topic)).toEqual([
      "CV ve yüksek lisans seçenekleri",
    ]);
  });

  it("pages to the next week and closes the dialog with Vazgeç", async () => {
    renderWithQueryClient(
      <OfficeHoursBookingView academicianId="sample-academician-kaya" />,
    );
    expect(await screen.findByText("9 – 13 Kasım 2026")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Sonraki hafta" }),
    );
    expect(screen.getByText("16 – 20 Kasım 2026")).toBeVisible();

    await pickFirstFreeTime();
    await userEvent.click(screen.getByRole("button", { name: "Devam Et" }));
    await userEvent.type(screen.getByLabelText(/Görüşme başlığı/), "Yarım");
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Devam Et" }));
    expect(screen.getByLabelText(/Görüşme başlığı/)).toHaveValue("");
  });

  it("cannot go back before the first bookable week, and opens on Monday at the weekend", async () => {
    vi.setSystemTime(new Date(2026, 10, 14, 10));
    renderWithQueryClient(
      <OfficeHoursBookingView academicianId="sample-academician-kaya" />,
    );
    expect(await screen.findByText("16 – 20 Kasım 2026")).toBeVisible();
    expect(screen.getByRole("button", { name: "Önceki hafta" })).toBeDisabled();
  });

  it("books the advisor from the institutional record", async () => {
    renderWithQueryClient(<OfficeHoursBookingView academicianId="advisor" />);
    expect(
      await screen.findByRole("heading", { name: "Doç. Dr. Elif Şahin" }),
    ).toBeVisible();
  });

  it("says so for an unknown academician", async () => {
    renderWithQueryClient(<OfficeHoursBookingView academicianId="nobody" />);
    expect(await screen.findByText("Bu akademisyen bulunamadı.")).toBeVisible();
  });
});
