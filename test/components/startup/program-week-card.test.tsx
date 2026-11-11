import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWeekCard } from "@/components/startup/program-week-card";
import { ClientApiError } from "@/lib/client/api";
import { getProgramThisWeek } from "@/lib/client/program-weeks";
import { thisWeek } from "@test/fixtures/program-week";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramThisWeek: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getProgramThisWeek).mockReset().mockResolvedValue(thisWeek());
});

describe("ProgramWeekCard", () => {
  it("shows the week number, phase, days and only this week's planned content", async () => {
    renderWithQueryClient(<ProgramWeekCard />);

    const card = await screen.findByRole("region", {
      name: "Kullanıcı görüşmeleri",
    });
    expect(within(card).getByText("Bu hafta")).toBeVisible();
    expect(within(card).getByText("Hafta 2 / 12")).toBeVisible();
    expect(
      within(card).getByText(/Hafta 2 · Fikir doğrulama · 12 Eki – 18 Eki/),
    ).toBeVisible();
    expect(
      within(card).getByRole("heading", { name: "Konular" }),
    ).toBeVisible();
    expect(within(card).getByText("Hedef kitle")).toBeVisible();
    expect(within(card).getByText("5 kullanıcıyla görüş")).toBeVisible();
    expect(within(card).getByText("Görüşme notları")).toBeVisible();
  });

  it("falls back to the phase and its expected output when the week has no plan", async () => {
    vi.mocked(getProgramThisWeek).mockResolvedValue(thisWeek({ plan: null }));
    renderWithQueryClient(<ProgramWeekCard />);

    expect(
      await screen.findByRole("heading", { name: "Fikir doğrulama" }),
    ).toBeVisible();
    expect(
      screen.getByText("Beklenen çıktı: Problem tanımı raporu"),
    ).toBeVisible();
  });

  it("says the coordinator hasn't added this week's syllabus when there is nothing for it", async () => {
    vi.mocked(getProgramThisWeek).mockResolvedValue(
      thisWeek({ plan: null, phases: [], hasSyllabus: false }),
    );
    renderWithQueryClient(<ProgramWeekCard />);

    expect(
      await screen.findByText(
        "Koordinatör henüz bu hafta için müfredat eklemedi.",
      ),
    ).toBeVisible();
  });

  it("says when the program starts and when it has ended", async () => {
    vi.mocked(getProgramThisWeek).mockResolvedValue(
      thisWeek({
        notStarted: true,
        week: null,
        weekStart: null,
        weekEnd: null,
        plan: null,
        phases: [],
      }),
    );
    const { unmount } = renderWithQueryClient(<ProgramWeekCard />);
    expect(
      await screen.findByText("Program 5 Ekim 2026 tarihinde başlıyor."),
    ).toBeVisible();
    unmount();

    vi.mocked(getProgramThisWeek).mockResolvedValue(
      thisWeek({ ended: true, week: null, plan: null, phases: [] }),
    );
    renderWithQueryClient(<ProgramWeekCard />);
    expect(await screen.findByText("Program tamamlandı.")).toBeVisible();
  });

  it("shows nothing to someone outside a program, and an error for anything else", async () => {
    vi.mocked(getProgramThisWeek).mockRejectedValue(
      new ClientApiError("Yok", 404),
    );
    const { unmount } = renderWithQueryClient(<ProgramWeekCard />);
    await vi.waitFor(() => expect(getProgramThisWeek).toHaveBeenCalled());
    await vi.waitFor(() => expect(screen.queryByText("Bu hafta")).toBeNull());
    unmount();

    vi.mocked(getProgramThisWeek).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 500),
    );
    renderWithQueryClient(<ProgramWeekCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu haftanın planı yüklenemedi.",
    );
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramWeekCard />
      </InLocale>,
    );
    expect(await screen.findByText("To hand in")).toBeVisible();
    expect(screen.getByText("This week")).toBeVisible();
  });
});
