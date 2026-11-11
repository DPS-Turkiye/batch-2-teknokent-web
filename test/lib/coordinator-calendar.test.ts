import { describe, expect, it } from "vitest";

import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import {
  CalendarView,
  conflictSummary,
  emptyEventDraft,
  eventDraftError,
  eventInput,
  fullRecordingCount,
  isoDay,
  mentorshipHref,
  placeDayItems,
  proposalItems,
  rangeLabel,
  recordingNote,
  shiftAnchor,
  slotLabel,
  startOfWeek,
  viewDays,
  viewRange,
  type CalendarTexts,
} from "@/lib/coordinator-calendar";
import {
  at,
  calendarMeeting,
  coordinatorCalendar,
} from "@test/fixtures/coordinator-calendar";
import { itemAt } from "@test/fixtures/list-assertions";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { translatorIn } from "@test/translators";

const WEDNESDAY = new Date(2026, 8, 16, 15, 0);

function texts(locale: "tr" | "en"): CalendarTexts {
  return {
    t: translatorIn(locale, "coordinatorCalendar"),
    locale,
  };
}

describe("coordinator calendar", () => {
  it("covers a Monday-to-Sunday week", () => {
    expect(isoDay(startOfWeek(WEDNESDAY))).toBe("2026-09-14");
    expect(isoDay(startOfWeek(new Date(2026, 8, 20)))).toBe("2026-09-14");
    expect(viewRange(CalendarView.Week, WEDNESDAY)).toEqual({
      from: "2026-09-14",
      to: "2026-09-20",
    });
    expect(rangeLabel(CalendarView.Week, WEDNESDAY, "tr")).toBe(
      "14–20 Eylül 2026",
    );
    expect(rangeLabel(CalendarView.Week, new Date(2026, 8, 30), "tr")).toMatch(
      /^28 Eylül\s–\s4 Ekim 2026$/,
    );
    expect(rangeLabel(CalendarView.Week, WEDNESDAY, "en")).toMatch(
      /^September 14\s–\s20, 2026$/,
    );
  });

  it("covers whole weeks around a month and steps by month", () => {
    const days = viewDays(CalendarView.Month, WEDNESDAY);
    expect(isoDay(itemAt(days, 0))).toBe("2026-08-31");
    expect(isoDay(itemAt(days, -1))).toBe("2026-10-04");
    expect(days.length % 7).toBe(0);
    expect(rangeLabel(CalendarView.Month, WEDNESDAY, "tr")).toBe("Eylül 2026");
    expect(rangeLabel(CalendarView.Month, WEDNESDAY, "en")).toBe(
      "September 2026",
    );
    expect(isoDay(shiftAnchor(CalendarView.Month, WEDNESDAY, 1))).toBe(
      "2026-10-01",
    );
    expect(isoDay(shiftAnchor(CalendarView.Week, WEDNESDAY, -1))).toBe(
      "2026-09-09",
    );
  });

  it("places items on the 09–19 grid and shifts overlapping ones", () => {
    const placed = placeDayItems([
      calendarMeeting({
        id: "late",
        startsAt: at(2, 11, 30),
        endsAt: at(2, 12, 30),
      }),
      calendarMeeting({ id: "early", startsAt: at(2, 11), endsAt: at(2, 12) }),
      calendarMeeting({
        id: "deadline",
        kind: CoordinatorAgendaKind.Deadline,
        startsAt: at(2, 23, 59),
        endsAt: null,
      }),
    ]);
    expect(
      placed.map((entry) => [entry.item.id, entry.top, entry.lane]),
    ).toEqual([
      ["early", 2, 0],
      ["late", 2.5, 1],
      ["deadline", 9.25, 0],
    ]);
    expect(placed[2]?.height).toBe(0.75);
  });

  it("labels slots and conflicts", () => {
    expect(slotLabel(calendarMeeting(), "tr")).toBe("Çar 16 Eyl · 14:00–15:00");
    expect(slotLabel(calendarMeeting(), "en")).toMatch(
      /^Wed Sep 16 · 2:00\s–\s3:00\sPM$/,
    );
    expect(
      slotLabel(
        calendarMeeting({
          kind: CoordinatorAgendaKind.Deadline,
          startsAt: at(3, 23, 59),
          endsAt: null,
        }),
        "tr",
      ),
    ).toBe("Per 17 Eyl · 23:59");
    const calendar = coordinatorCalendar();
    const conflict = itemAt(calendar.conflicts, 0);
    expect(conflictSummary(conflict, calendar.items, texts("tr"))).toEqual({
      heading: "2 çakışma",
      who: "Ahmet Can · Çar",
      body: "Nova Robotics (11:00) ve Vega (11:30) görüşmeleri üst üste bindi.",
    });
    expect(conflictSummary(conflict, calendar.items, texts("en"))).toEqual({
      heading: "2 conflicts",
      who: "Ahmet Can · Wed",
      body: "The meetings with Nova Robotics (11:00 AM) and Vega (11:30 AM) overlap.",
    });
    expect(mentorshipHref("mentorship-1")).toBe(
      "/coordinator/mentorships?mentorship=mentorship-1",
    );
  });

  it("validates and converts the add-event draft", () => {
    const draft = emptyEventDraft("program-1", WEDNESDAY);
    expect(draft.day).toBe("2026-09-16");
    expect(eventDraftError(draft)).toBe("Başlık girin.");
    expect(eventDraftError({ ...draft, programId: "" })).toBe(
      "Bir program seçin.",
    );
    const titled = { ...draft, title: " Demo Day " };
    expect(
      eventDraftError({ ...titled, startTime: "12:00", endTime: "11:00" }),
    ).toBe("Bitiş saati başlangıçtan sonra olmalı.");
    expect(eventDraftError(titled)).toBeNull();
    expect(
      eventInput({
        ...titled,
        kind: ProgramEventKind.Deadline,
        description: "  ",
      }),
    ).toEqual({
      title: "Demo Day",
      kind: ProgramEventKind.Deadline,
      startsAt: new Date(2026, 8, 16, 10, 0).toISOString(),
      endsAt: null,
      description: null,
    });
  });

  it("shows how many rooms the recording bot holds at a meeting's time", () => {
    const { t } = texts("tr");
    expect(recordingNote(calendarMeeting({ recordingLoad: 1 }), 2, t)).toBe(
      "Kayıt botu 1/2",
    );
    expect(recordingNote(calendarMeeting({ recordingLoad: 2 }), 2, t)).toBe(
      "Kayıt botu 2/2 · dolu",
    );
    expect(
      recordingNote(calendarMeeting({ recordingLoad: 2 }), 2, texts("en").t),
    ).toBe("Recording bot 2/2 · full");
    expect(
      recordingNote(calendarMeeting({ recordingLoad: null }), 2, t),
    ).toBeNull();
    expect(
      fullRecordingCount(
        coordinatorCalendar({
          items: [
            calendarMeeting({ recordingLoad: 2 }),
            calendarMeeting({ id: "m-2", recordingLoad: 1 }),
          ],
        }),
      ),
    ).toBe(1);
  });

  it("turns pending proposals in the range into Önerilen slot meetings", () => {
    const items = proposalItems(
      [
        meetingProposal({ scheduledAt: "2026-09-18T07:30:00Z" }),
        meetingProposal({
          id: "confirmed",
          status: MeetingProposalStatus.Confirmed,
        }),
        meetingProposal({ id: "later", scheduledAt: "2026-10-30T07:30:00Z" }),
      ],
      { from: "2026-09-14", to: "2026-09-20" },
      "Önerilen slot",
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "proposal-proposal-1",
      proposalId: "proposal-1",
      kind: CoordinatorAgendaKind.Meeting,
      mentorshipId: "mentorship-1",
      endsAt: "2026-09-18T08:15:00.000Z",
      conflict: false,
    });
  });

  it("leaves out a proposal that belongs to no program", () => {
    const items = proposalItems(
      [
        meetingProposal({ id: "outside", programId: null, mentorshipId: null }),
        meetingProposal({ scheduledAt: "2026-09-18T07:30:00Z" }),
      ],
      { from: "2026-09-14", to: "2026-09-20" },
      "Önerilen slot",
    );

    expect(items.map((item) => item.proposalId)).toEqual(["proposal-1"]);
  });
});
