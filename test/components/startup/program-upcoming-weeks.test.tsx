import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramUpcomingWeeks } from "@/components/startup/program-upcoming-weeks";
import { PROGRAM_PAST_WEEKS_QUERY_KEY } from "@/hooks/use-program-past-weeks";
import { ClientApiError } from "@/lib/client/api";
import { getProgramWeeksSoFar } from "@/lib/client/program-weeks";
import {
  planSession,
  planWeek,
  weekSoFar,
  weeksSoFar,
} from "@test/fixtures/program-week";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramWeeksSoFar: vi.fn(),
}));

const early = (week: number, title: string) =>
  weekSoFar(week, {
    upcoming: true,
    plan: planWeek({
      week,
      title,
      startDate: "2026-10-26",
      endDate: "2026-11-01",
      sessions: [planSession({ date: "2026-10-28", title: "Workshop: Pitch" })],
    }),
  });

beforeEach(() => {
  vi.mocked(getProgramWeeksSoFar)
    .mockReset()
    .mockResolvedValue(
      weeksSoFar({
        currentWeek: 2,
        weeks: [
          weekSoFar(1),
          weekSoFar(2, { current: true }),
          early(5, "Demo provası"),
          early(4, "Pitch"),
        ],
      }),
    );
});

describe("ProgramUpcomingWeeks", () => {
  it("lists only the weeks opened early, soonest first, as collapsed cards", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramUpcomingWeeks />);

    const section = await screen.findByRole("region", {
      name: "Yaklaşan haftalar",
    });
    expect(
      within(section)
        .getAllByText(/^Hafta \d · /)
        .map((title) => title.textContent),
    ).toEqual(["Hafta 4 · Pitch", "Hafta 5 · Demo provası"]);
    expect(within(section).queryByText(/Hafta [12] · /)).toBeNull();

    await user.click(within(section).getByText("Hafta 4 · Pitch"));
    expect(
      within(section).getAllByRole("list", { name: "Oturumlar" })[0],
    ).toHaveTextContent("Workshop: Pitch");
  });

  it("shows nothing while no week is opened early", async () => {
    vi.mocked(getProgramWeeksSoFar).mockResolvedValue(weeksSoFar());
    const { queryClient } = renderWithQueryClient(<ProgramUpcomingWeeks />);

    await vi.waitFor(() =>
      expect(
        queryClient.getQueryState(PROGRAM_PAST_WEEKS_QUERY_KEY)?.status,
      ).toBe("success"),
    );
    expect(screen.queryByText("Yaklaşan haftalar")).toBeNull();
  });

  it("leaves a failure to Geçmiş haftalar and shows nothing itself", async () => {
    vi.mocked(getProgramWeeksSoFar).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 502),
    );
    const { queryClient } = renderWithQueryClient(<ProgramUpcomingWeeks />);

    await vi.waitFor(() =>
      expect(
        queryClient.getQueryState(PROGRAM_PAST_WEEKS_QUERY_KEY)?.status,
      ).toBe("error"),
    );
    expect(screen.queryByText("Yaklaşan haftalar")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("speaks English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramUpcomingWeeks />
      </InLocale>,
    );

    expect(
      await screen.findByRole("region", { name: "Upcoming weeks" }),
    ).toBeVisible();
  });
});
