import { StartupStage } from "@/interfaces/startup-process";

export const STARTUP_STAGE_LABELS: Record<StartupStage, string> = {
  [StartupStage.Problem]: "Problem",
  [StartupStage.Solution]: "Çözüm",
  [StartupStage.Mvp]: "MVP",
  [StartupStage.BusinessModel]: "İş Modeli",
  [StartupStage.Market]: "Pazar",
  [StartupStage.Finance]: "Finans",
  [StartupStage.Pitch]: "Pitch",
};

// Round dates arrive as calendar days ("2026-08-02"); reading them as local
// midnight keeps them on the same day in every time zone.
function calendarDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dayAndShortMonth(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** "2 · 31 Ağu" within one month, "28 Tem · 5 Ağu" across two. */
export function formatRoundRange(startsOn: string, endsOn: string) {
  const start = calendarDay(startsOn);
  const end = calendarDay(endsOn);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const from = sameMonth ? String(start.getDate()) : dayAndShortMonth(start);
  return `${from} · ${dayAndShortMonth(end)}`;
}
