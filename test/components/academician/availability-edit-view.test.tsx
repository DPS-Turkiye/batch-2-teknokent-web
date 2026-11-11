import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianAvailabilityEditView } from "@/components/academician/availability-edit-view";
import {
  resetAcademicianSample,
  sampleState,
} from "@/lib/client/fixtures/academician-office-hours-store";
import { fetchInstitutionAdvisees } from "@/lib/client/institution";
import { renderWithQueryClient } from "@test/test-utils";

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

// Tuesday 10 November 2026, 10:00 in Istanbul, before the sample data is placed around "now".
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
  window.history.replaceState(
    null,
    "",
    "/academician/appointments/availability",
  );
  vi.mocked(fetchInstitutionAdvisees).mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

function renderView() {
  return renderWithQueryClient(<AcademicianAvailabilityEditView />);
}

async function list(name: string) {
  return screen.findByRole("region", { name });
}

function setField(dialog: HTMLElement, label: string, value: string) {
  fireEvent.change(within(dialog).getByLabelText(label), {
    target: { value },
  });
}

describe("AcademicianAvailabilityEditView", () => {
  it("shows the calendar and the three lists that make the hours", async () => {
    renderView();

    const weekly = await list("Tekrarlanan haftalık müsaitlik");
    expect(weekly).toHaveTextContent("Her Salı · 14:00 – 16:00");
    expect(weekly).toHaveTextContent("Her Perşembe · 10:00 – 12:00");
    expect(weekly.closest("[data-tour]")).toHaveAttribute(
      "data-tour",
      "availability-weekly",
    );
    expect(await list("Tek seferlik müsaitlik")).toHaveTextContent(
      "16 Kasım 2026 · 13:00–15:00",
    );
    expect(await list("Müsait olmadığım günler")).toHaveTextContent(
      "20–22 Kasım 2026 · Tüm günMüsait değilim (Konferans)",
    );
    expect(screen.getByRole("link", { name: "Randevularım" })).toHaveAttribute(
      "href",
      "/academician/appointments",
    );
    expect(
      await screen.findByRole("heading", { name: "9–15 Kasım 2026" }),
    ).toBeVisible();
    expect(screen.getByText("Nasıl hesaplanır?")).toBeVisible();
  });

  it("adds a weekly range and refuses one that clashes", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Tekrarlanan haftalık müsaitlik listesine ekle",
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Müsaitlik ekle" });
    await user.selectOptions(within(dialog).getByLabelText("Gün"), "Salı");
    setField(dialog, "Başlangıç", "15:00");
    setField(dialog, "Bitiş", "17:00");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Bu saatler mevcut bir kayıtla çakışıyor.",
    );

    await user.selectOptions(within(dialog).getByLabelText("Gün"), "Cuma");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText("Müsaitlik kaydedildi.")).toBeVisible();
    expect(await list("Tekrarlanan haftalık müsaitlik")).toHaveTextContent(
      "Her Cuma · 15:00 – 17:00",
    );
  });

  it("edits a range from its menu", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Her Salı · 14:00 – 16:00 için seçenekler",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Düzenle" }));

    const dialog = screen.getByRole("dialog", { name: "Müsaitliği düzenle" });
    expect(within(dialog).getByLabelText("Başlangıç")).toHaveValue("14:00");
    setField(dialog, "Bitiş", "17:00");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await list("Tekrarlanan haftalık müsaitlik")).toHaveTextContent(
      "Her Salı · 14:00 – 17:00",
    );
  });

  it("deletes only after the menu's confirmation, and Escape closes the menu", async () => {
    const user = userEvent.setup();
    renderView();
    const menuButton = await screen.findByRole("button", {
      name: "Her Perşembe · 10:00 – 12:00 için seçenekler",
    });
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();

    await user.click(menuButton);
    await user.click(screen.getByRole("button", { name: "Sil" }));
    expect(screen.getByText("Silinsin mi?")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Evet, sil" }));

    expect(await screen.findByText("Silindi.")).toBeVisible();
    await waitFor(() => {
      expect(sampleState().availability.rules).toHaveLength(1);
    });
  });

  it("adds a day off from the page's button, choosing the kind first", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", { name: "Müsaitlik Ekle" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Müsaitlik ekle" });
    await user.click(
      within(dialog).getByRole("radio", { name: /Müsait olmadığım günler/ }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Tarih ve saatleri doldur.",
    );
    setField(dialog, "İlk gün", "2026-11-25");
    await user.type(within(dialog).getByLabelText("Neden (opsiyonel)"), "Jüri");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await list("Müsait olmadığım günler")).toHaveTextContent(
      "25 Kasım 2026 · Tüm günMüsait değilim (Jüri)",
    );
  });

  it("refuses one-off hours on a day off", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(
      await screen.findByRole("button", {
        name: "Tek seferlik müsaitlik listesine ekle",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Müsaitlik ekle" });
    setField(dialog, "Tarih", "2026-11-21");
    setField(dialog, "Başlangıç", "10:00");
    setField(dialog, "Bitiş", "11:00");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Bu gün müsait değil olarak işaretli; önce o günü kaldır.",
    );
  });
});
