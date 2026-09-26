import type {
  CoordinatorProgram,
  CoordinatorProgramDetail,
  CoordinatorRef,
  CreateProgramInput,
  CreateProgramEventInput,
  ProgramEvent,
  ProgramPhaseInput,
  ProgramTeam,
  TeamInviteInput,
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

export async function createCoordinatorProgram(input: CreateProgramInput) {
  return requireSuccess(
    await httpClient.post<CoordinatorProgramDetail>(
      "/api/coordinator/programs",
      input,
    ),
  );
}

export async function getProgramTeams(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramTeam[]>(`${programUrl(programId)}/teams`),
  );
}

export async function addProgramTeams(
  programId: string,
  teams: TeamInviteInput[],
) {
  return requireSuccess(
    await httpClient.post<ProgramTeam[]>(`${programUrl(programId)}/teams`, {
      teams,
    }),
  );
}

export async function updateProgramTeam(
  programId: string,
  inviteId: string,
  input: TeamInviteInput,
) {
  return requireSuccess(
    await httpClient.put<ProgramTeam[]>(
      `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
      input,
    ),
  );
}

export async function removeProgramTeam(programId: string, inviteId: string) {
  return requireSuccess(
    await httpClient.delete<ProgramTeam[]>(
      `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    ),
  );
}
