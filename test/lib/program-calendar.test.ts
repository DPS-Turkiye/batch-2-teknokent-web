import { describe, expect, it } from "vitest";

import { ProgramCalendarEntryKind } from "@/interfaces/coordinator-program";
import {
  isAllDay,
  programEntryKindLabel,
  programEntryLines,
  programEntryTime,
  programEntryWhen,
  programEventRange,
  programEventsByDay,
} from "@/lib/program-calendar";
import {
  demoDay,
  lessonSession,
  memberProgramEvent,
  planItem,
  workshopSession,
} from "@test/fixtures/program-calendar";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "programCalendar");

describe("programEntryKindLabel", () => {
  it("names each kind of program entry", () => {
    expect(
      [
        ProgramCalendarEntryKind.Session,
        ProgramCalendarEntryKind.SpecialDay,
        ProgramCalendarEntryKind.Event,
        ProgramCalendarEntryKind.Deadline,
      ].map((kind) => programEntryKindLabel(kind, t)),
    ).toEqual([
      "Program oturumu",
      "Özel gün",
      "Program etkinliği",
      "Son tarih",
    ]);
  });
});

describe("programEntryLines", () => {
  it("gives the lesson's speaker first, then its week", () => {
    expect(programEntryLines(lessonSession(), t)).toEqual([
      "Konuşmacı: Sarper",
      "4. hafta · Sorunu Doğrula",
    ]);
  });

  it("gives a workshop its week only, since the speaker is the lesson's", () => {
    expect(programEntryLines(workshopSession(), t)).toEqual([
      "4. hafta · Sorunu Doğrula",
    ]);
  });

  it("gives a special day its place and details but no week", () => {
    expect(programEntryLines(demoDay(), t)).toEqual([
      "Yer: KKM",
      "Program final etkinliği.",
    ]);
  });

  it("keeps a program event's own description and skips a blank one", () => {
    expect(
      programEntryLines(memberProgramEvent({ description: " B-104 " }), t),
    ).toEqual(["B-104"]);
    expect(
      programEntryLines(memberProgramEvent({ description: "  " }), t),
    ).toEqual([]);
  });

  it("leaves the week out when its title is missing", () => {
    expect(
      programEntryLines(
        workshopSession({ plan: planItem({ weekTitle: null }) }),
        t,
      ),
    ).toEqual([]);
  });
});

describe("programEntryTime and programEntryWhen", () => {
  it("says all day for an entry the plan prints without a time", () => {
    expect(isAllDay(lessonSession())).toBe(true);
    expect(programEntryTime(lessonSession(), "tr", t)).toBe("Tüm gün");
    expect(programEntryWhen(lessonSession(), "tr", t)).toBe(
      "16 Kasım 2026 Pazartesi · Tüm gün",
    );
  });

  it("gives a start and end, or the start alone without an end", () => {
    expect(programEntryTime(memberProgramEvent(), "tr", t)).toBe("16:00–17:30");
    expect(isAllDay(memberProgramEvent())).toBe(false);
    expect(programEntryTime(demoDay(), "tr", t)).toBe("13:00");
  });
});

describe("programEventRange", () => {
  it("runs from the first day's midnight to the midnight after the last day", () => {
    const days = [new Date(2026, 10, 16, 9, 30), new Date(2026, 10, 22, 18)];

    expect(programEventRange(days)).toEqual({
      from: new Date(2026, 10, 16),
      to: new Date(2026, 10, 23),
    });
  });

  it("covers today when no day is given", () => {
    const { from, to } = programEventRange([]);

    expect(to.getTime() - from.getTime()).toBeGreaterThanOrEqual(
      23 * 3_600_000,
    );
  });
});

describe("programEventsByDay", () => {
  it("puts each entry under its own day in start order", () => {
    const days = [new Date(2026, 10, 16), new Date(2026, 10, 17)];
    const evening = memberProgramEvent({
      id: "evening",
      startsAt: new Date(2026, 10, 16, 20).toISOString(),
    });

    expect(
      programEventsByDay(
        [evening, lessonSession(), workshopSession()],
        days,
      ).map((day) => day.map((event) => event.id)),
    ).toEqual([["session-lesson", "evening"], []]);
  });
});
