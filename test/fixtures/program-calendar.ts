import {
  ProgramCalendarEntryKind,
  type MemberProgramEvent,
  type ProgramCalendarPlanItem,
} from "@/interfaces/coordinator-program";

/** A program's own event as `GET /api/programs/events` sends it. */
export function memberProgramEvent(
  overrides: Partial<MemberProgramEvent> = {},
): MemberProgramEvent {
  return {
    id: "event-1",
    programId: "program-1",
    programName: "Build",
    title: "Ürün-Pazar Uyumu Atölyesi",
    kind: ProgramCalendarEntryKind.Event,
    startsAt: new Date(2026, 10, 18, 16, 0).toISOString(),
    endsAt: new Date(2026, 10, 18, 17, 30).toISOString(),
    description: null,
    plan: null,
    ...overrides,
  };
}

export function planItem(
  overrides: Partial<ProgramCalendarPlanItem> = {},
): ProgramCalendarPlanItem {
  return {
    week: 4,
    weekTitle: "Sorunu Doğrula",
    place: null,
    speaker: null,
    details: [],
    allDay: true,
    ...overrides,
  };
}

/** Build week 4's lesson on Monday 16 November: all day, with the week's speaker. */
export function lessonSession(
  overrides: Partial<MemberProgramEvent> = {},
): MemberProgramEvent {
  return memberProgramEvent({
    id: "session-lesson",
    title: "Değer Önerisi ve Market Fit",
    kind: ProgramCalendarEntryKind.Session,
    startsAt: new Date(2026, 10, 16).toISOString(),
    endsAt: null,
    plan: planItem({ speaker: "Sarper" }),
    ...overrides,
  });
}

/** Build week 4's workshop, two days after the week's start (#231). */
export function workshopSession(
  overrides: Partial<MemberProgramEvent> = {},
): MemberProgramEvent {
  return memberProgramEvent({
    id: "session-workshop",
    title: "Workshop: Burcu Tarhan",
    kind: ProgramCalendarEntryKind.Session,
    startsAt: new Date(2026, 10, 18).toISOString(),
    endsAt: null,
    plan: planItem(),
    ...overrides,
  });
}

/** Demo Day, which a participant sees ahead of its week. */
export function demoDay(
  overrides: Partial<MemberProgramEvent> = {},
): MemberProgramEvent {
  return memberProgramEvent({
    id: "special-demo",
    title: "DEMO DAY",
    kind: ProgramCalendarEntryKind.SpecialDay,
    startsAt: new Date(2027, 0, 9, 13, 0).toISOString(),
    endsAt: null,
    plan: planItem({
      week: null,
      weekTitle: null,
      place: "KKM",
      details: ["Program final etkinliği."],
      allDay: false,
    }),
    ...overrides,
  });
}
