import type { ProgramPlanWeek } from "@/interfaces/program-week";
import {
  WeeklyProgramWarningCode,
  type WeeklyProgramProposal,
} from "@/interfaces/weekly-program";
import { planWeek } from "@test/fixtures/program-week";

/** A week of a synthetic weekly program (invented names, as in the backend's look-alike fixture). */
export function programWeek(
  week: number,
  title: string,
  overrides: Partial<ProgramPlanWeek> = {},
): ProgramPlanWeek {
  return planWeek({
    week,
    startDate: null,
    endDate: null,
    title,
    topics: [`Oturum: ${title}`, "Konuşmacı: Deniz Örnek"],
    activities: ["Workshop: Ekip çalışması"],
    deliverables: ["Haftalık görev"],
    ...overrides,
  });
}

/** Ten Tuesday weeks in four phases, two weeks printed off the calendar, a demo day after the last week. */
export function weeklyProgramProposal(
  overrides: Partial<WeeklyProgramProposal> = {},
): WeeklyProgramProposal {
  return {
    totalWeeks: 11,
    weeks: [
      programWeek(1, "Yola Çık", {
        startDate: "2026-10-27",
        endDate: "2026-11-02",
      }),
      programWeek(2, "Problemi Anla"),
      programWeek(3, "Saha Gezisi 1", {
        topics: [],
        activities: ["Ziyaret: Örnek Teknopark ofisleri"],
      }),
      programWeek(4, "Fikir Üret"),
      programWeek(5, "Değer Önerisi"),
      programWeek(6, "Pazarı Tanı"),
      programWeek(7, "İş Modeli"),
      programWeek(8, "Saha Gezisi 2"),
      programWeek(9, "Doğrula"),
      programWeek(10, "Sun"),
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
