import type { CreateProgramInput } from "@/interfaces/coordinator-program";
import type { ProgramType } from "@/interfaces/program";

export enum WizardStep {
  Type = "TYPE",
  Info = "INFO",
  Coordinators = "COORDINATORS",
  Summary = "SUMMARY",
}

export const WIZARD_STEPS = Object.values(WizardStep);

export enum WizardProblem {
  TypeRequired = "TYPE_REQUIRED",
  NameRequired = "NAME_REQUIRED",
  DatesOrder = "DATES_ORDER",
  CoordinatorRequired = "COORDINATOR_REQUIRED",
}

export type ProgramWizardDraft = {
  type: ProgramType | null;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  coordinatorIds: string[];
};

/** A new draft; when the edition offers a single program type, it is already chosen. */
export function emptyWizardDraft(
  programTypes: readonly ProgramType[],
): ProgramWizardDraft {
  return {
    type: programTypes.length === 1 ? (programTypes[0] ?? null) : null,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    coordinatorIds: [],
  };
}

/** What stops the admin from leaving a step; dates are optional but must be in order. */
export function stepProblem(
  step: WizardStep,
  draft: ProgramWizardDraft,
): WizardProblem | null {
  if (step === WizardStep.Type && !draft.type) {
    return WizardProblem.TypeRequired;
  }
  if (step === WizardStep.Info) {
    if (!draft.name.trim()) return WizardProblem.NameRequired;
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      return WizardProblem.DatesOrder;
    }
  }
  if (step === WizardStep.Coordinators && draft.coordinatorIds.length === 0) {
    return WizardProblem.CoordinatorRequired;
  }
  return null;
}

export function toggleCoordinator(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function createProgramInput(
  draft: ProgramWizardDraft,
  type: ProgramType,
): CreateProgramInput {
  return {
    type,
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    coordinatorIds: draft.coordinatorIds,
  };
}
