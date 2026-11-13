import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianAppointmentsView } from "@/components/academician/appointments-view";
import {
  appointmentsHref,
  type AppointmentsSearch,
} from "@/lib/academician-calendar";
import {
  resetAcademicianSample,
  sampleState,
} from "@/lib/client/fixtures/academician-office-hours-store";
import { fetchInstitutionAdvisees } from "@/lib/client/institution";
import { AppointmentsCalendarView } from "@/types/academician-calendar";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", async (importOriginal) => {
  const { useLocationSearchParams } = await import("@test/mocks/search-params");
  return {
    ...(await importOriginal<typeof import("next/navigation")>()),
    useSearchParams: useLocationSearchParams,
  };
});

vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));

// The sample data sits around "now" when the fixture module loads, so the clock is pinned to Tuesday
// 10 November 2026, 10:00 in Istanbul, before those imports and in every test.
const MORNING = vi.hoisted(() => {
  const morning = new Date("2026-11-10T07:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(morning);
  return morning;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(MORNING);
  resetAcademicianSample();
  window.history.replaceState(null, "", "/academician/appointments");
  vi.mocked(fetchInstitutionAdvisees)
    .mockReset()
    .mockResolvedValue([
      {
        userId: "sample-student-deniz",
        fullName: "Deniz Kaya",
        departmentName: null,
        classYear: 3,
        programLevel: null,
      },
    ]);
});

afterEach(() => {
  vi.useRealTimers();
});

/** Opens the page at the URL `search` describes, as a link or a reload would. */
function renderView(search: Partial<AppointmentsSearch> = {}) {
  window.history.replaceState(
    null,
    "",
    appointmentsHref("/academician/appointments", search),
  );
  return renderWithQueryClient(<AcademicianAppointmentsView />);
}

async function calendarTitle(name: string) {
  return screen.findByRole("heading", { level: 2, name });
}

describe("AcademicianAppointmentsView", () => {
  it("shows the week with appointments, requests and the hours, and the rail", async () => {
    renderView();

    await calendarTitle("9–15 Kasım 2026");
    expect(
      screen.getByRole("heading", { level: 1, name: "Randevularım" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Talepler · 2" })).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Zeynep Arslan, 15:30–16:00, Onaylandı",
      }),
    ).toBeVisible();
    // The earliest time waiting for the academician is where the product tour points.
    expect(
      screen.getByRole("button", {
        name: "Deniz Kaya, 14:00–14:30, Onay Bekliyor",
      }),
    ).toHaveAttribute("data-tour", "calendar-pending-request");
    expect(
      screen.getByRole("button", {
        name: "Zeynep Arslan, 11:00–11:30, Öneri · öğrenci yanıtı",
      }),
    ).toBeVisible();

    const rail = screen.getByRole("region", {
      name: /Yanıt bekleyen talepler/,
    });
    expect(within(rail).getByText("Danışanın")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Öğrenci yanıtı bekleniyor" }),
    ).toHaveTextContent("Mert DemirSorunu yanıtlaması bekleniyor");
    expect(
      screen.getByRole("region", { name: "Müsaitliğim" }),
    ).toHaveTextContent("Her Salı14:00 – 16:00");
  });

  it("filters the calendar and keeps the choice in the URL", async () => {
    const user = userEvent.setup();
    renderView();
    await calendarTitle("9–15 Kasım 2026");

    await user.click(screen.getByRole("button", { name: "Randevular" }));

    expect(screen.getByRole("button", { name: "Randevular" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", {
        name: "Deniz Kaya, 14:00–14:30, Onay Bekliyor",
      }),
    ).not.toBeInTheDocument();
    expect(window.location.search).toBe("?filter=appointments");
  });

  it("moves between weeks and switches views from the month grid", async () => {
    const user = userEvent.setup();
    renderView({ view: AppointmentsCalendarView.Month });

    await calendarTitle("Kasım 2026");
    await user.click(
      screen.getByRole("button", { name: "12 Kasım gününü aç" }),
    );
    await calendarTitle("12 Kasım 2026, Perşembe");
    expect(window.location.search).toBe("?view=day&date=2026-11-12");

    await user.click(screen.getByRole("radio", { name: "Hafta" }));
    await user.click(screen.getByRole("button", { name: "Önceki" }));
    await calendarTitle("2–8 Kasım 2026");
    await user.click(screen.getByRole("button", { name: "Bugün" }));
    await calendarTitle("9–15 Kasım 2026");
  });

  it("switches views with the arrow keys", async () => {
    const user = userEvent.setup();
    renderView();
    await calendarTitle("9–15 Kasım 2026");

    screen.getByRole("radio", { name: "Hafta" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "Ay" })).toHaveFocus();
    await calendarTitle("Kasım 2026");
  });

  it("opens a request's drawer, says how the time fits, and closes on Escape", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Deniz Kaya, 14:00–14:30, Onay Bekliyor",
      }),
    );

    const drawer = screen.getByRole("dialog", { name: "Randevu talebi" });
    expect(
      within(drawer).getByText("Bilgisayar Mühendisliği · 3. sınıf"),
    ).toBeVisible();
    expect(
      within(drawer).getByText("Bu saat Çarşamba müsaitliğinin dışında."),
    ).toBeVisible();
    expect(window.location.search).toBe("?request=sample-request-1");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("accepts the time the academician picks among several", async () => {
    const user = userEvent.setup();
    renderView({ request: "sample-request-2" });

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    const accept = within(drawer).getByRole("button", { name: "Kabul Et" });
    expect(accept).toBeDisabled();
    expect(accept.closest("[data-tour]")).toHaveAttribute(
      "data-tour",
      "request-drawer-accept",
    );
    await user.click(
      within(drawer).getByRole("radio", {
        name: /12 Kasım 2026 Perşembe · 10:00–10:30/,
      }),
    );
    expect(
      within(drawer).getByText(
        "Bu saat Perşembe müsaitliğinle uyumlu; çakışma yok.",
      ),
    ).toBeVisible();
    await user.click(accept);

    expect(
      await screen.findByText("Talep kabul edildi, randevu oluşturuldu."),
    ).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      await screen.findByRole("button", {
        name: "Ece Aksoy, 10:00–10:30, Onaylandı",
      }),
    ).toBeVisible();
  });

  it("won't accept a requested time that has already passed", async () => {
    // Deniz asked for tomorrow 14:00; a day later that time is gone.
    vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
    renderView({ request: "sample-request-1" });

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    expect(within(drawer).getByText("Bu saat geçti.")).toBeVisible();
    expect(
      within(drawer).getByRole("button", { name: "Kabul Et" }),
    ).toBeDisabled();
  });

  it("declines with an optional note to the student", async () => {
    const user = userEvent.setup();
    renderView({ request: "sample-request-1" });

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    await user.click(within(drawer).getByRole("button", { name: "Reddet" }));
    await user.type(
      within(drawer).getByRole("textbox", {
        name: "Öğrenciye not (opsiyonel)",
      }),
      "Bu hafta dolu",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Talebi Reddet" }),
    );

    expect(await screen.findByText("Talep reddedildi.")).toBeVisible();
    expect(
      sampleState().requests.some(
        (request) => request.id === "sample-request-1",
      ),
    ).toBe(false);
  });

  it("offers no answer on a request that waits for the student", async () => {
    renderView({ request: "sample-request-4" });

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    expect(within(drawer).getByText("Alternatif Saat Önerildi")).toBeVisible();
    expect(
      within(drawer).queryByRole("button", { name: "Kabul Et" }),
    ).toBeNull();
  });

  it("says so when a linked request is gone", async () => {
    renderView({ request: "sample-request-404" });

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    expect(drawer).toHaveTextContent("Bu talep artık yanıtını beklemiyor");
  });

  it("steps back with X after opening a drawer here, so history keeps no closed drawer", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Deniz Kaya, 14:00–14:30, Onay Bekliyor",
      }),
    );
    expect(window.location.search).toBe("?request=sample-request-1");

    const back = vi.spyOn(window.history, "back");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Kapat" }),
    );

    expect(back).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    back.mockRestore();
  });

  it("takes a linked drawer out of the URL with X, without leaving the page", async () => {
    const user = userEvent.setup();
    renderView({ request: "sample-request-1" });
    const back = vi.spyOn(window.history, "back");

    const drawer = await screen.findByRole("dialog", {
      name: "Randevu talebi",
    });
    await user.click(within(drawer).getByRole("button", { name: "Kapat" }));

    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    back.mockRestore();
  });

  it("closes the drawer with the browser's Back button", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Deniz Kaya, 14:00–14:30, Onay Bekliyor",
      }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();

    act(() => {
      window.history.back();
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("cancels an appointment more than a day ahead without a reason", async () => {
    const user = userEvent.setup();
    renderView({ appointment: "sample-appointment-2" });

    const drawer = await screen.findByRole("dialog", { name: "Randevu" });
    expect(drawer).toHaveTextContent("meet.example.org/ofis-saati");
    await user.click(
      within(drawer).getByRole("button", { name: "Randevuyu iptal et" }),
    );
    await user.click(within(drawer).getByRole("button", { name: "İptal et" }));

    expect(await screen.findByText("Randevu iptal edildi.")).toBeVisible();
  });

  it("asks for a reason when the appointment starts within 24 hours", async () => {
    const user = userEvent.setup();
    renderView({ appointment: "sample-appointment-1" });

    const drawer = await screen.findByRole("dialog", { name: "Randevu" });
    await user.click(
      within(drawer).getByRole("button", { name: "Randevuyu iptal et" }),
    );
    await user.click(within(drawer).getByRole("button", { name: "İptal et" }));

    expect(within(drawer).getByRole("alert")).toHaveTextContent(
      "Başlamasına 24 saatten az kaldı",
    );
    await user.type(
      within(drawer).getByRole("textbox", { name: "Öğrenciye gerekçe" }),
      "Kurul toplantısı",
    );
    await user.click(within(drawer).getByRole("button", { name: "İptal et" }));
    expect(await screen.findByText("Randevu iptal edildi.")).toBeVisible();
  });

  it("says an appointment the source booked cannot be cancelled here", async () => {
    renderView({ appointment: "sample-appointment-3" });

    const drawer = await screen.findByRole("dialog", { name: "Randevu" });
    expect(drawer).toHaveTextContent("Bu randevu buradan iptal edilemiyor.");
    expect(
      within(drawer).queryByRole("button", { name: "Randevuyu iptal et" }),
    ).toBeNull();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianAppointmentsView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "My appointments" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "Requests · 2" }),
    ).toBeVisible();
  });
});
