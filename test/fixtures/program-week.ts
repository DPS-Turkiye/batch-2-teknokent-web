import type {
  ProgramPlanWeek,
  ProgramThisWeek,
} from "@/interfaces/program-week";

export function planWeek(
  overrides: Partial<ProgramPlanWeek> = {},
): ProgramPlanWeek {
  return {
    week: 2,
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    title: "Kullanıcı görüşmeleri",
    topics: ["Problem tanımı", "Hedef kitle"],
    activities: ["5 kullanıcıyla görüş"],
    deliverables: ["Görüşme notları"],
    inferred: false,
    ...overrides,
  };
}

/** Week 2 of a twelve-week program that started on 5 October, inside its first phase. */
export function thisWeek(
  overrides: Partial<ProgramThisWeek> = {},
): ProgramThisWeek {
  return {
    programId: "program-1",
    programName: "İŞKUR Gençlik Programı",
    programStart: "2026-10-05",
    programEnd: "2026-12-27",
    week: 2,
    totalWeeks: 12,
    weekStart: "2026-10-12",
    weekEnd: "2026-10-18",
    notStarted: false,
    ended: false,
    hasSyllabus: true,
    plan: planWeek(),
    phases: [
      {
        id: "phase-1",
        name: "Fikir doğrulama",
        position: 0,
        startDate: "2026-10-05",
        endDate: "2026-10-25",
        expectedOutput: "Problem tanımı raporu",
        current: true,
      },
    ],
    ...overrides,
  };
}
