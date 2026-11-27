import "server-only";

import type {
  CreateProgramAssignmentInput,
  ProgramAssignment,
  UpdateProgramAssignmentInput,
} from "@/interfaces/program-assignment";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/assignments`;

export function fetchProgramAssignments(actorId: string, programId: string) {
  return backendRequest<ProgramAssignment[]>({
    method: HttpMethod.Get,
    url: programUrl(programId),
    params: { actorId },
  });
}

export function createProgramAssignment(
  actorId: string,
  programId: string,
  input: CreateProgramAssignmentInput,
) {
  return backendRequest<ProgramAssignment>({
    method: HttpMethod.Post,
    url: programUrl(programId),
    data: { actorId, ...input },
  });
}

export function updateProgramAssignment(
  actorId: string,
  programId: string,
  assignmentId: string,
  input: UpdateProgramAssignmentInput,
) {
  return backendRequest<ProgramAssignment>({
    method: HttpMethod.Put,
    url: `${programUrl(programId)}/${encodeURIComponent(assignmentId)}`,
    data: { actorId, ...input },
  });
}

export function deleteProgramAssignment(
  actorId: string,
  programId: string,
  assignmentId: string,
) {
  return backendRequest<null>({
    method: HttpMethod.Delete,
    url: `${programUrl(programId)}/${encodeURIComponent(assignmentId)}`,
    params: { actorId },
  });
}
