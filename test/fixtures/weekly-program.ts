import type { ProgramPlanWeek } from "@/interfaces/program-week";
import {
  WeeklyProgramWarningCode,
  type WeeklyProgramProposal,
} from "@/interfaces/weekly-program";

/** A week of a synthetic weekly program (invented names, as in the backend's look-alike fixture). */
export function planWeek(
  week: number,
  title: string,
  overrides: Partial<ProgramPlanWeek> = {},
): ProgramPlanWeek {
  return {
    week,
    startDate: null,
    endDate: null,
    title,
    topics: [`Oturum: ${title}`, "Konuşmacı: Deniz Örnek"],
    activities: ["Workshop: Ekip çalışması"],
    deliverables: ["Haftalık görev"],
    inferred: false,
    ...overrides,
  };
}

/** Ten Tuesday weeks in four phases, two weeks printed off the calendar, a demo day after the last week. */
export function weeklyProgramProposal(
  overrides: Partial<WeeklyProgramProposal> = {},
): WeeklyProgramProposal {
  return {
    totalWeeks: 11,
    weeks: [
      planWeek(1, "Yola Çık", {
        startDate: "2026-10-27",
        endDate: "2026-11-02",
      }),
      planWeek(2, "Problemi Anla"),
      planWeek(3, "Saha Gezisi 1", {
        topics: [],
        activities: ["Ziyaret: Örnek Teknopark ofisleri"],
      }),
      planWeek(4, "Fikir Üret"),
      planWeek(5, "Değer Önerisi"),
      planWeek(6, "Pazarı Tanı"),
      planWeek(7, "İş Modeli"),
      planWeek(8, "Saha Gezisi 2"),
      planWeek(9, "Doğrula"),
      planWeek(10, "Sun"),
    ],
    phases: [
      {
        name: "Problemi Keşfet",
        expectedOutput: "Problem tanımı",
        firstWeek: 1,
        lastWeek: 3,
        startDate: "2026-10-27",
        endDate: "2026-11-16",
      },
      {
        name: "Fikir ve Değer",
        expectedOutput: null,
        firstWeek: 4,
        lastWeek: 5,
        startDate: "2026-11-17",
        endDate: "2026-11-30",
      },
      {
        name: "Pazar ve İş Modeli",
        expectedOutput: null,
        firstWeek: 6,
        lastWeek: 8,
        startDate: "2026-12-01",
        endDate: "2026-12-21",
      },
      {
        name: "Doğrula ve Sun",
        expectedOutput: "Sunum ve 90 günlük plan",
        firstWeek: 9,
        lastWeek: 10,
        startDate: "2026-12-22",
        endDate: "2027-01-04",
      },
    ],
    warnings: [{ code: WeeklyProgramWarningCode.DatesDiffer, weeks: [8, 10] }],
    notes: ["9 Ocak Cumartesi — Demo Day"],
    readingWarnings: [],
    pageCount: 1,
    existing: { phaseCount: 0, weekCount: 0, currentWeek: null },
    ...overrides,
  };
}
