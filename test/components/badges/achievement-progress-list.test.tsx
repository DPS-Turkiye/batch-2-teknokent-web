import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AchievementProgressList } from "@/components/badges/achievement-progress-list";
import { BadgeCode, type AchievementProgress } from "@/interfaces/badges";
import { getMyAchievements } from "@/lib/client/badges";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/badges", () => ({ getMyAchievements: vi.fn() }));

function row(overrides: Partial<AchievementProgress>): AchievementProgress {
  return {
    code: BadgeCode.FirstSession,
    earned: false,
    awardedAt: null,
    current: 0,
    target: 1,
    average: null,
    averageTarget: null,
    ...overrides,
  };
}

describe("AchievementProgressList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an earned achievement with its date and the others with how far along", async () => {
    vi.mocked(getMyAchievements).mockResolvedValue([
      row({ earned: true, awardedAt: "2026-11-03T09:00:00Z", current: 1 }),
      row({ code: BadgeCode.Sessions10, current: 4, target: 10 }),
      row({ code: BadgeCode.Hours25, current: 395, target: 1500 }),
      row({
        code: BadgeCode.WellRated,
        current: 3,
        target: 5,
        average: 4.7,
        averageTarget: 4.5,
      }),
      row({ code: BadgeCode.ActiveMentee, current: 1, target: 3 }),
    ]);
    renderWithQueryClient(<AchievementProgressList />);

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("İlk Görüşme");
    expect(items[0]).toHaveTextContent("tarihinde kazanıldı");
    expect(items[1]).toHaveTextContent("4/10 görüşme");
    expect(items[2]).toHaveTextContent("6/25 saat");
    expect(items[3]).toHaveTextContent(
      "3/5 değerlendirme · ortalama 4,7 (en az 4,5)",
    );
    expect(items[4]).toHaveTextContent("Geri bildirim verdiğin 1/3 görüşme");
    expect(
      screen.getByRole("progressbar", { name: "10 Görüşme" }),
    ).toHaveAttribute("aria-valuenow", "40");
    expect(
      screen.queryByRole("progressbar", { name: "İlk Görüşme" }),
    ).toBeNull();
  });

  it("says when the progress could not be loaded", async () => {
    vi.mocked(getMyAchievements).mockRejectedValue(new Error("down"));
    renderWithQueryClient(<AchievementProgressList />);
    expect(
      await screen.findByText("Başarı rozetleri yüklenemedi."),
    ).toBeInTheDocument();
  });
});
