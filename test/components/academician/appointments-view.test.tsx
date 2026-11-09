import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AcademicianAppointmentsView } from "@/components/academician/appointments-view";
import { groupAppointments } from "@/hooks/use-academician-appointments";
import { ACADEMICIAN_APPOINTMENTS_SAMPLE } from "@/lib/client/fixtures/academician-office-hours";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

beforeEach(() => resetAcademicianSample());

function row(topic: string) {
  return screen.getByText(topic).closest("li") as HTMLElement;
}

describe("AcademicianAppointmentsView", () => {
  it("shows upcoming confirmed appointments first, with place, link and status", async () => {
    renderWithQueryClient(<AcademicianAppointmentsView />);
    const list = await screen.findByRole("list", { name: "Yaklaşan" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Yaklaşan (3)" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Geçmiş (1)" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "İptal edilenler (1)" }),
    ).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent("Örnek veriler");
    const online = row("Final öncesi tekrar");
    expect(
      within(online).getByRole("link", { name: "Çevrim içi bağlantı" }),
    ).toHaveAttribute("href", "https://meet.example.org/ofis-saati");
    expect(within(online).getByText("Onaylandı")).toBeVisible();
    // A course-based source books appointments it cannot cancel.
    const fixed = row("Ödev 2 geri bildirimi");
    expect(within(fixed).getByText(/Ders: CENG 101/)).toBeVisible();
    expect(within(fixed).queryByRole("button")).toBeNull();
  });

  it("needs a reason to cancel within 24 hours, then moves the appointment to cancelled", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianAppointmentsView />);
    await screen.findByRole("list", { name: "Yaklaşan" });
    const soon = row("Bitirme projesi danışmanlığı");
    await user.click(
      within(soon).getByRole("button", { name: "Randevuyu iptal et" }),
    );
    const form = within(soon).getByRole("form", { name: "Randevuyu iptal et" });
    expect(form).toHaveTextContent("neden yazman gerekiyor");
    await user.click(within(form).getByRole("button", { name: "İptal et" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Son 24 saatteki iptal için neden yaz.",
    );
    await user.type(within(form).getByRole("textbox"), "Kurul toplantısı");
    await user.click(within(form).getByRole("button", { name: "İptal et" }));
    expect(
      await screen.findByText("Randevu iptal edildi; öğrenciye bildirilecek."),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "İptal edilenler (2)" }),
    );
    expect(screen.getByText("Bitirme projesi danışmanlığı")).toBeVisible();
    expect(screen.getAllByText(/Son 24 saatte iptal edildi/).length).toBe(2);
  });

  it("cancels a later appointment without a reason, and can step back", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianAppointmentsView />);
    await screen.findByRole("list", { name: "Yaklaşan" });
    const later = row("Final öncesi tekrar");
    await user.click(
      within(later).getByRole("button", { name: "Randevuyu iptal et" }),
    );
    await user.click(within(later).getByRole("button", { name: "Vazgeç" }));
    expect(within(later).queryByRole("form")).toBeNull();
    await user.click(
      within(later).getByRole("button", { name: "Randevuyu iptal et" }),
    );
    await user.click(within(later).getByRole("button", { name: "İptal et" }));
    expect(
      await screen.findByText("Randevu iptal edildi; öğrenciye bildirilecek."),
    ).toBeVisible();
  });

  it("groups past, upcoming and cancelled appointments around now", () => {
    const groups = groupAppointments(
      ACADEMICIAN_APPOINTMENTS_SAMPLE,
      Date.now(),
    );
    expect(groups.upcoming.map((item) => item.id)).toEqual([
      "sample-appointment-1",
      "sample-appointment-2",
      "sample-appointment-3",
    ]);
    expect(groups.past.map((item) => item.id)).toEqual([
      "sample-appointment-5",
    ]);
    expect(groups.cancelled.map((item) => item.id)).toEqual([
      "sample-appointment-4",
    ]);
  });

  it("reads in English and says when a tab is empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianAppointmentsView />
      </InLocale>,
    );
    await screen.findByRole("list", { name: "Upcoming" });
    expect(
      screen.getByRole("heading", { name: "My appointments" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Past (1)" }));
    expect(screen.getByText("Kariyer planı")).toBeVisible();
  });
});
