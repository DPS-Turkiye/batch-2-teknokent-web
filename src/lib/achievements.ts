import { BadgeCode, type AchievementProgress } from "@/interfaces/badges";

/**
 * How far an achievement is, for its bar: 0–100. WELL_RATED also needs its average, so a full count with a low
 * average stays just short of done.
 */
export function achievementPercent(row: AchievementProgress) {
  if (row.earned) return 100;
  if (row.target <= 0) return 0;
  const share = Math.min(row.current / row.target, 1);
  const averageMissing =
    row.code === BadgeCode.WellRated &&
    share === 1 &&
    (row.average == null ||
      row.averageTarget == null ||
      row.average < row.averageTarget);
  return Math.round(share * (averageMissing ? 95 : 100));
}

/** The numbers its progress line shows; HOURS_25 counts minutes and shows whole hours. */
export function achievementCounts(row: AchievementProgress) {
  if (row.code === BadgeCode.Hours25) {
    return {
      current: Math.floor(row.current / 60),
      target: Math.round(row.target / 60),
    };
  }
  return { current: Math.min(row.current, row.target), target: row.target };
}
