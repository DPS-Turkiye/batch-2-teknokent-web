import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  emptyPhase,
  healthShares,
  movePhase,
  overviewActions,
  phasesChanged,
  programHeaderLine,
  settingsDraftError,
  settingsDraftOf,
  stepDays,
  RULE_LIMITS,
} from "@/lib/coordinator-program-detail";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";

import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const t = createTranslator({
  locale: "tr",
  messages: tr,
  namespace: "coordinatorPrograms",
});
const tEn = createTranslator({
  locale: "en",
  messages: en,
  namespace: "coordinatorPrograms",
});

describe("coordinator program detail", () => {
  it("writes the header line with the phase, week and every coordinator", () => {
    expect(programHeaderLine(coordinatorProgramDetail(), t, "tr")).toContain(
      "Mentorluk dönemi, hafta 6/16 · Koordinatörler: Elif Demir, Burcu Şen",
    );
    expect(programHeaderLine(coordinatorProgramDetail(), tEn, "en")).toContain(
      "Mentorluk dönemi, week 6/16 · Coordinators: Elif Demir, Burcu Şen",
    );
  });

  it("splits the health bar and lists only the actions that need someone", () => {
    const detail = coordinatorProgramDetail();
    const shares = healthShares(detail.health);
    expect(shares.total).toBe(64);
    expect(Math.round(shares.healthy + shares.followUp + shares.risky)).toBe(
      100,
    );
    expect(overviewActions(detail, t).map((action) => action.title)).toEqual([
      "5 takım eşleşme bekliyor",
      "5 mentor yanıt bekliyor",
      "4 görüşme: not eksik",
    ]);
    expect(overviewActions(detail, tEn).map((action) => action.title)).toEqual([
      "5 teams are waiting for a match",
      "5 mentors haven't replied",
      "4 meetings: notes missing",
    ]);
    expect(
      overviewActions(
        coordinatorProgramDetail({
          program: { ...detail.program, awaitingMatchCount: 0 },
          mentors: { ...detail.mentors, pending: 0 },
          missingNoteMeetings: 0,
        }),
        t,
      ),
    ).toEqual([]);
  });

  it("keeps rule days inside their limits", () => {
    expect(stepDays(1, -1, RULE_LIMITS.meetingFrequencyDays)).toBe(1);
    expect(stepDays(90, 1, RULE_LIMITS.meetingFrequencyDays)).toBe(90);
    expect(stepDays(14, 1, RULE_LIMITS.staleAfterDays)).toBe(15);
  });

  it("validates the settings draft and notices phase changes", () => {
    const detail = coordinatorProgramDetail();
    const draft = settingsDraftOf(detail);
    expect(settingsDraftError(draft)).toBeNull();
    expect(phasesChanged(draft, detail)).toBe(false);
    expect(settingsDraftError({ ...draft, name: " " })).toBe(
      "Program adı gerekli.",
    );
    expect(
      settingsDraftError({
        ...draft,
        startDate: "2026-09-10",
        endDate: "2026-09-01",
      }),
    ).toBe("Program bitişi başlangıçtan önce olamaz.");
    expect(
      settingsDraftError({ ...draft, phases: [...draft.phases, emptyPhase()] }),
    ).toBe("Her fazın bir adı olmalı.");
    const moved = { ...draft, phases: movePhase(draft.phases, 0, 1) };
    expect(moved.phases.map((phase) => phase.name)).toEqual([
      "Mentorluk dönemi",
      "Başvuru",
      "Demo Day",
    ]);
    expect(phasesChanged(moved, detail)).toBe(true);
    expect(movePhase(draft.phases, 0, -1)).toBe(draft.phases);
  });
});
