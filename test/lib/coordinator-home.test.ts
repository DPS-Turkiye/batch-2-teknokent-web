import { describe, expect, it } from "vitest";

import {
  type CoordinatorAgendaItem,
  CoordinatorAgendaKind,
} from "@/interfaces/coordinator-overview";
import {
  agendaForToday,
  agendaWhen,
  hasOpenActions,
  meetingSlotLabel,
} from "@/lib/coordinator-home";

const now = new Date(2026, 8, 24, 10, 0);

function item(at: Date, allDay = false): CoordinatorAgendaItem {
  return {
    kind: CoordinatorAgendaKind.Event,
    title: "Atölye",
    subtitle: null,
    at: at.toISOString(),
    allDay,
  };
}

describe("coordinator home helpers", () => {
  it("keeps only today's agenda items", () => {
    const today = item(new Date(2026, 8, 24, 16, 0));
    const later = item(new Date(2026, 8, 26, 9, 0));
    expect(agendaForToday([today, later], now)).toEqual([today]);
  });

  it("labels today and other days, and hides the time of a due date", () => {
    expect(agendaWhen(item(new Date(2026, 8, 24, 16, 0)), now)).toEqual({
      day: "Bugün",
      time: "16:00",
    });
    expect(agendaWhen(item(new Date(2026, 8, 26, 0, 0), true), now)).toEqual({
      day: "26 Eyl",
      time: "Gün içinde",
    });
  });

  it("describes the next meeting's slot", () => {
    expect(
      meetingSlotLabel(
        {
          scheduledAt: new Date(2026, 8, 25, 14, 0).toISOString(),
          durationMinutes: 60,
        } as Parameters<typeof meetingSlotLabel>[0],
        now,
      ),
    ).toBe("Yarın · 14:00–15:00");
  });

  it("knows whether anything needs a decision", () => {
    expect(
      hasOpenActions({
        pendingMentors: [],
        awaitingTeams: [],
        missingNotes: [],
      }),
    ).toBe(false);
    expect(
      hasOpenActions({
        pendingMentors: [],
        awaitingTeams: [{}],
        missingNotes: [],
      }),
    ).toBe(true);
  });
});
