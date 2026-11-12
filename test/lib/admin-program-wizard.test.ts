import { describe, expect, it } from "vitest";

import { ProgramType } from "@/interfaces/program";
import {
  createProgramInput,
  emptyWizardDraft,
  stepProblem,
  WizardProblem,
  WizardStep,
} from "@/lib/admin-program-wizard";
import {
  CoordinatorChoiceKind,
  existingChoice,
  invitedChoice,
} from "@/lib/coordinator-picker";

describe("admin program wizard", () => {
  it("asks for a type, a name, dates in order and a coordinator", () => {
    const draft = emptyWizardDraft();
    expect(stepProblem(WizardStep.Type, draft)).toBe(
      WizardProblem.TypeRequired,
    );
    expect(stepProblem(WizardStep.Info, { ...draft, name: "  " })).toBe(
      WizardProblem.NameRequired,
    );
    expect(
      stepProblem(WizardStep.Info, {
        ...draft,
        name: "Akran",
        startDate: "2026-12-01",
        endDate: "2026-11-01",
      }),
    ).toBe(WizardProblem.DatesOrder);
    expect(
      stepProblem(WizardStep.Info, { ...draft, name: "Akran" }),
    ).toBeNull();
    expect(stepProblem(WizardStep.Coordinators, draft)).toBe(
      WizardProblem.CoordinatorRequired,
    );
    expect(
      stepProblem(WizardStep.Coordinators, {
        ...draft,
        coordinators: [
          {
            kind: CoordinatorChoiceKind.Invited,
            fullName: "Yeni",
            email: "yeni@x.org",
          },
        ],
      }),
    ).toBeNull();
    expect(stepProblem(WizardStep.Summary, draft)).toBeNull();
  });

  it("sends the type, trimmed details, no empty dates and the coordinators", () => {
    expect(
      createProgramInput(
        {
          ...emptyWizardDraft(),
          name: "  ODTÜ Akran 2027 ",
          description: " ",
          coordinators: [
            existingChoice({
              id: "c1",
              fullName: "Ayşe Aydın",
              email: "ayse@teknokent.org",
            }),
            invitedChoice(" Yeni@Teknokent.org ", " Yeni Kişi "),
          ],
        },
        ProgramType.PeerMentoring,
      ),
    ).toEqual({
      type: ProgramType.PeerMentoring,
      name: "ODTÜ Akran 2027",
      description: null,
      startDate: null,
      endDate: null,
      coordinatorIds: ["c1"],
      newCoordinators: [{ fullName: "Yeni Kişi", email: "yeni@teknokent.org" }],
    });
  });
});
