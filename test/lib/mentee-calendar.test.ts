import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { CalendarFilter } from "@/lib/calendar";
import {
  CalendarEntryKind,
  DAY_HEADER_HEIGHT,
  deliverableEntries,
  entryWhenLabel,
  eventBox,
  filterEntries,
  HOUR_ROW_HEIGHT,
  meetingEntries,
  prepHeading,
  PrepStatus,
  prepStatus,
  upcomingEntries,
  weekSummary,
} from "@/lib/mentee-calendar";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "m-1",
    organizationId: "org-1",
    mentorName: "Nihan Öztürk",
    agenda: "Ürün konumlandırma kararları",
    scheduledAt: new Date(2026, 7, 28, 14, 0).toISOString(),
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

const deliverable = {
  id: "ai-1",
  title: "Customer Interview Summary",
  dueDate: "2026-08-27",
  status: ActionItemStatus.Open,
};

describe("mentee calendar entries", () => {
  it("names a meeting by its mentor on the grid and by its agenda in lists", () => {
    const [entry] = meetingEntries([
      meeting(),
      meeting({ id: "m-2", status: MeetingStatus.Cancelled }),
    ]);

    expect(entry).toMatchObject({
      kind: CalendarEntryKind.Mentorship,
      gridLabel: "Nihan Öztürk",
      title: "Ürün konumlandırma kararları",
      detail: "Nihan Öztürk · mentorluk",
    });
    expect(
      meetingEntries([meeting({ status: MeetingStatus.Cancelled })]),
    ).toEqual([]);
  });

  it("puts open deliverables at the end of their due day, once each", () => {
    const entries = deliverableEntries([
      deliverable,
      deliverable,
      { ...deliverable, id: "ai-2", status: ActionItemStatus.Completed },
      { ...deliverable, id: "ai-3", dueDate: null },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].startsAt).toEqual(new Date(2026, 7, 27, 17, 0));
    expect(entries[0].gridLabel).toBe("Teslim");
  });

  it("filters by kind", () => {
    const entries = [
      ...meetingEntries([meeting()]),
      ...deliverableEntries([deliverable]),
    ];

    expect(filterEntries(entries, CalendarFilter.All)).toHaveLength(2);
    expect(
      filterEntries(entries, CalendarFilter.Deliverable).map((e) => e.kind),
    ).toEqual([CalendarEntryKind.Deliverable]);
    expect(filterEntries(entries, CalendarFilter.Program)).toEqual([]);
  });

  it("places an event by its start time and length, and hides ones outside 09–19", () => {
    const [entry] = meetingEntries([meeting()]);

    expect(eventBox(entry)).toEqual({
      top: DAY_HEADER_HEIGHT + 5 * HOUR_ROW_HEIGHT,
      height: 0.75 * HOUR_ROW_HEIGHT,
    });
    const [late] = meetingEntries([
      meeting({ scheduledAt: new Date(2026, 7, 28, 20, 0).toISOString() }),
    ]);
    expect(eventBox(late)).toBeNull();
  });

  it("summarises the week and leaves program events out until there are some", () => {
    const entries = [
      ...meetingEntries([meeting()]),
      ...deliverableEntries([deliverable]),
    ];

    expect(weekSummary(entries)).toBe(
      "Bu hafta 1 mentorluk görüşmesi · 1 teslim",
    );
  });

  it("lists what is still ahead, soonest first", () => {
    const entries = [
      ...meetingEntries([meeting()]),
      ...deliverableEntries([deliverable]),
    ];
    const now = new Date(2026, 7, 26, 9, 0);

    expect(upcomingEntries(entries, now, 3).map(entryWhenLabel)).toEqual([
      "Per 27",
      "Cum 28 · 14:00",
    ]);
    expect(upcomingEntries(entries, new Date(2026, 7, 29), 3)).toEqual([]);
  });

  it("marks preparation overdue only once its due day has passed", () => {
    const now = new Date(2026, 7, 27, 18, 0);

    expect(prepStatus({ ...deliverable, dueDate: "2026-08-26" }, now)).toBe(
      PrepStatus.Overdue,
    );
    expect(prepStatus(deliverable, now)).toBe(PrepStatus.InProgress);
    expect(prepStatus({ ...deliverable, dueDate: null }, now)).toBe(
      PrepStatus.InProgress,
    );
  });

  it("describes the meeting a preparation is for", () => {
    expect(prepHeading(meeting())).toBe(
      "Cuma 28 Ağustos · Nihan Öztürk görüşmesi",
    );
  });
});
