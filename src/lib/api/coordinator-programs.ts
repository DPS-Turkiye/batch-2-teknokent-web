import "server-only";

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
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorPrograms(actorId: string) {
  return backendRequest<CoordinatorProgram[]>({
    method: "GET",
    url: "/api/coordinator/programs",
    params: { actorId },
  });
}

export function createCoordinatorProgramEvent(
  actorId: string,
  programId: string,
  input: CreateProgramEventInput,
) {
  return backendRequest<ProgramEvent>({
    method: "POST",
    url: `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
    data: { ...input, actorId },
  });
}

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}`;

export function fetchCoordinatorProgram(actorId: string, programId: string) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "GET",
    url: programUrl(programId),
    params: { actorId },
  });
}

export function updateCoordinatorProgram(
  actorId: string,
  programId: string,
  input: UpdateProgramDetailsInput,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: programUrl(programId),
    data: { ...input, actorId },
  });
}

export function replaceCoordinatorProgramPhases(
  actorId: string,
  programId: string,
  phases: ProgramPhaseInput[],
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: `${programUrl(programId)}/phases`,
    data: { actorId, phases },
  });
}

export function setCoordinatorProgramArchived(
  actorId: string,
  programId: string,
  archived: boolean,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: `${programUrl(programId)}/archive`,
    data: { actorId, archived },
  });
}

export function fetchProgramCoordinators(
  actorId: string,
  programId: string,
  candidates = false,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "GET",
    url: `${programUrl(programId)}/coordinators${candidates ? "/candidates" : ""}`,
    params: { actorId },
  });
}

export function addProgramCoordinator(
  actorId: string,
  programId: string,
  userId: string,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "POST",
    url: `${programUrl(programId)}/coordinators`,
    data: { actorId, userId },
  });
}

export function removeProgramCoordinator(
  actorId: string,
  programId: string,
  userId: string,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/coordinators/${encodeURIComponent(userId)}`,
    params: { actorId },
  });
}

export function createCoordinatorProgram(
  actorId: string,
  input: CreateProgramInput,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "POST",
    url: "/api/coordinator/programs",
    data: { ...input, actorId },
  });
}

export function fetchProgramTeams(actorId: string, programId: string) {
  return backendRequest<ProgramTeam[]>({
    method: "GET",
    url: `${programUrl(programId)}/teams`,
    params: { actorId },
  });
}

export function addProgramTeams(
  actorId: string,
  programId: string,
  teams: TeamInviteInput[],
) {
  return backendRequest<ProgramTeam[]>({
    method: "POST",
    url: `${programUrl(programId)}/teams`,
    data: { actorId, teams },
  });
}

export function updateProgramTeam(
  actorId: string,
  programId: string,
  inviteId: string,
  input: TeamInviteInput,
) {
  return backendRequest<ProgramTeam[]>({
    method: "PUT",
    url: `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    params: { actorId },
    data: input,
  });
}

export function removeProgramTeam(
  actorId: string,
  programId: string,
  inviteId: string,
) {
  return backendRequest<ProgramTeam[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    params: { actorId },
  });
}
