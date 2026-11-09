import { describe, expect, it } from "vitest";

import { BadgeCode, type AchievementProgress } from "@/interfaces/badges";
import { achievementCounts, achievementPercent } from "@/lib/achievements";

function row(overrides: Partial<AchievementProgress>): AchievementProgress {
  return {
    code: BadgeCode.Sessions10,
    earned: false,
    awardedAt: null,
    current: 0,
    target: 10,
    average: null,
    averageTarget: null,
    ...overrides,
  };
}

describe("achievement progress", () => {
  it("fills the bar by count and caps it, full once earned", () => {
    expect(achievementPercent(row({ current: 4 }))).toBe(40);
    expect(achievementPercent(row({ current: 14 }))).toBe(100);
    expect(achievementPercent(row({ current: 2, earned: true }))).toBe(100);
  });

  it("keeps a well-rated mentor with enough ratings but a low average just short", () => {
    const rated = row({
      code: BadgeCode.WellRated,
      current: 6,
      target: 5,
      average: 4.2,
      averageTarget: 4.5,
    });
    expect(achievementPercent(rated)).toBe(95);
    expect(achievementPercent({ ...rated, average: 4.6 })).toBe(100);
  });

  it("shows hours for the hours badge and never more than the target", () => {
    expect(
      achievementCounts(
        row({ code: BadgeCode.Hours25, current: 395, target: 1500 }),
      ),
    ).toEqual({ current: 6, target: 25 });
    expect(achievementCounts(row({ current: 12 }))).toEqual({
      current: 10,
      target: 10,
    });
  });
});
