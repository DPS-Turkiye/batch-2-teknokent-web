import type {
  CoordinatorProgram,
  CoordinatorProgramDetail,
  CoordinatorRef,
  CreateProgramEventInput,
  ProgramEvent,
  ProgramPhaseInput,
  UpdateProgramDetailsInput,
} from "@/interfaces/coordinator-program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorPrograms() {
  return requireSuccess(
    await httpClient.get<CoordinatorProgram[]>("/api/coordinator/programs"),
  );
}

export async function createCoordinatorProgramEvent(
  programId: string,
  input: CreateProgramEventInput,
) {
  return requireSuccess(
    await httpClient.post<ProgramEvent>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
      input,
    ),
  );
}

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}`;

export async function getCoordinatorProgram(programId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorProgramDetail>(programUrl(programId)),
  );
}

export async function updateCoordinatorProgram(
  programId: string,
  input: UpdateProgramDetailsInput,
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      programUrl(programId),
      input,
    ),
  );
}

export async function replaceCoordinatorProgramPhases(
  programId: string,
  phases: ProgramPhaseInput[],
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      `${programUrl(programId)}/phases`,
      { phases },
    ),
  );
}

export async function setCoordinatorProgramArchived(
  programId: string,
  archived: boolean,
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      `${programUrl(programId)}/archive`,
      { archived },
    ),
  );
}

export async function getProgramCoordinators(programId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators`,
    ),
  );
}

export async function getProgramCoordinatorCandidates(programId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators/candidates`,
    ),
  );
}

export async function addProgramCoordinator(programId: string, userId: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators`,
      { userId },
    ),
  );
}

export async function removeProgramCoordinator(
  programId: string,
  userId: string,
) {
  return requireSuccess(
    await httpClient.delete<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators/${encodeURIComponent(userId)}`,
    ),
  );
}
