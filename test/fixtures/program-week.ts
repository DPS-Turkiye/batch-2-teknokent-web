import type {
  ProgramPlanWeek,
  ProgramSession,
  ProgramSpecialDay,
  ProgramThisWeek,
  ProgramWeekPlan,
  ProgramWeekSoFar,
  ProgramWeeksSoFar,
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
    datesFromSource: false,
    sessions: [],
    menteeVisibility: null,
    ...overrides,
  };
}

/** A saved plan with no special days whose dates match the program's. */
export function weekPlan(
  overrides: Partial<ProgramWeekPlan> = {},
): ProgramWeekPlan {
  return {
    totalWeeks: 12,
    weeks: [],
    specialDays: [],
    dateCheck: null,
    ...overrides,
  };
}

/** Monday's session of a week that meets three times, as Growth Circuit prints it. */
export function planSession(
  overrides: Partial<ProgramSession> = {},
): ProgramSession {
  return {
    date: "2026-11-09",
    startTime: "18:00:00",
    endTime: "20:00:00",
    place: "Online",
    title: "Yapılandırılmış eğitim",
    ...overrides,
  };
}

/** A demo day: its own dated entry, not part of a week. */
export function specialDay(
  overrides: Partial<ProgramSpecialDay> = {},
): ProgramSpecialDay {
  return {
    date: "2026-12-15",
    startTime: "15:00:00",
    endTime: null,
    place: "KKM",
    title: "Demo Günü",
    details: ["Konuşmacı: Deniz Örnek"],
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
    specialDays: [],
    planHidden: false,
    ...overrides,
  };
}

/** Week `week` of the plan as "Geçmiş haftalar" receives it: a past week unless `current` says otherwise. */
export function weekSoFar(
  week: number,
  overrides: Partial<ProgramWeekSoFar> = {},
): ProgramWeekSoFar {
  return {
    plan: planWeek({ week, title: `Hafta ${week} konusu` }),
    current: false,
    upcoming: false,
    specialDays: [],
    ...overrides,
  };
}

/** The weeks a program has reached, week 3 running. */
export function weeksSoFar(
  overrides: Partial<ProgramWeeksSoFar> = {},
): ProgramWeeksSoFar {
  return {
    programId: "program-1",
    programName: "İŞKUR Gençlik Programı",
    currentWeek: 3,
    weeks: [weekSoFar(1), weekSoFar(2), weekSoFar(3, { current: true })],
    ...overrides,
  };
}
