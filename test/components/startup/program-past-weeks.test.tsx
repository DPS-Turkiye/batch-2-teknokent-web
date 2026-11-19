import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramPastWeeks } from "@/components/startup/program-past-weeks";
import { PROGRAM_PAST_WEEKS_QUERY_KEY } from "@/hooks/use-program-past-weeks";
import { ClientApiError } from "@/lib/client/api";
import { getProgramWeeksSoFar } from "@/lib/client/program-weeks";
import {
  planSession,
  planWeek,
  specialDay,
  weekSoFar,
  weeksSoFar,
} from "@test/fixtures/program-week";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramWeeksSoFar: vi.fn(),
}));

const secondWeek = weekSoFar(2, {
  plan: planWeek({
    week: 2,
    title: "Kullanıcı görüşmeleri",
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    topics: ["Problem tanımı"],
    activities: ["Workshop: Müşteri keşfi"],
    deliverables: ["Görüşme notları"],
    sessions: [
      planSession({
        date: "2026-10-14",
        title: "Workshop: Müşteri keşfi",
      }),
    ],
  }),
  specialDays: [specialDay({ date: "2026-10-16", title: "Bootcamp" })],
});

const firstWeek = weekSoFar(1, {
  plan: planWeek({
    week: 1,
    title: "Tanışma",
    startDate: "2026-10-05",
    endDate: "2026-10-11",
    topics: ["Ekip kurulumu"],
    activities: [],
    deliverables: [],
  }),
});

beforeEach(() => {
  vi.mocked(getProgramWeeksSoFar)
    .mockReset()
    .mockResolvedValue(
      weeksSoFar({
        weeks: [firstWeek, secondWeek, weekSoFar(3, { current: true })],
      }),
    );
});

describe("ProgramPastWeeks", () => {
  it("lists the past weeks newest first, collapsed, without the running week", async () => {
    renderWithQueryClient(<ProgramPastWeeks />);

    const section = await screen.findByRole("region", {
      name: "Geçmiş haftalar",
    });
    const titles = within(section)
      .getAllByText(/^Hafta \d · /)
      .map((title) => title.textContent);
    expect(titles).toEqual([
      "Hafta 2 · Kullanıcı görüşmeleri",
      "Hafta 1 · Tanışma",
    ]);
    expect(within(section).queryByText(/Hafta 3/)).toBeNull();
    expect(within(section).getByText("12 Eki – 18 Eki")).toBeVisible();
    expect(within(section).getByText("Problem tanımı")).not.toBeVisible();
  });

  it("opens a week to show its topics, workshop, deliverables, sessions and special days", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramPastWeeks />);

    await user.click(
      await screen.findByText("Hafta 2 · Kullanıcı görüşmeleri"),
    );

    expect(screen.getByText("Problem tanımı")).toBeVisible();
    expect(screen.getByRole("list", { name: "Oturumlar" })).toHaveTextContent(
      "Workshop: Müşteri keşfi",
    );
    expect(screen.getByRole("list", { name: "Özel günler" })).toHaveTextContent(
      "Bootcamp",
    );
    expect(screen.getByText("Görüşme notları")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Yapılacaklar" })).toBeVisible();
  });

  it("leaves out a week the coordinator opened early", async () => {
    vi.mocked(getProgramWeeksSoFar).mockResolvedValue(
      weeksSoFar({
        weeks: [
          firstWeek,
          weekSoFar(3, { current: true }),
          weekSoFar(5, { upcoming: true }),
        ],
      }),
    );
    renderWithQueryClient(<ProgramPastWeeks />);

    const section = await screen.findByRole("region", {
      name: "Geçmiş haftalar",
    });
    expect(
      within(section)
        .getAllByText(/^Hafta \d · /)
        .map((title) => title.textContent),
    ).toEqual(["Hafta 1 · Tanışma"]);
  });

  it("shows nothing when only the running week has begun", async () => {
    vi.mocked(getProgramWeeksSoFar).mockResolvedValue(
      weeksSoFar({ currentWeek: 1, weeks: [weekSoFar(1, { current: true })] }),
    );
    const { queryClient } = renderWithQueryClient(<ProgramPastWeeks />);

    await vi.waitFor(() =>
      expect(
        queryClient.getQueryState(PROGRAM_PAST_WEEKS_QUERY_KEY)?.status,
      ).toBe("success"),
    );
    expect(screen.queryByText("Geçmiş haftalar")).toBeNull();
    expect(screen.queryByText(/^Hafta 1/)).toBeNull();
  });

  it("shows nothing before the program starts", async () => {
    vi.mocked(getProgramWeeksSoFar).mockResolvedValue(
      weeksSoFar({ currentWeek: null, weeks: [] }),
    );
    const { queryClient } = renderWithQueryClient(<ProgramPastWeeks />);

    await vi.waitFor(() =>
      expect(
        queryClient.getQueryState(PROGRAM_PAST_WEEKS_QUERY_KEY)?.status,
      ).toBe("success"),
    );
    expect(screen.queryByText("Geçmiş haftalar")).toBeNull();
  });

  it("says the past weeks could not be loaded", async () => {
    vi.mocked(getProgramWeeksSoFar).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 502),
    );
    renderWithQueryClient(<ProgramPastWeeks />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Geçmiş haftalar yüklenemedi.",
    );
  });

  it("speaks English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramPastWeeks />
      </InLocale>,
    );

    expect(
      await screen.findByRole("region", { name: "Past weeks" }),
    ).toBeVisible();
    expect(screen.getByText("Week 2 · Kullanıcı görüşmeleri")).toBeVisible();
  });
});
