import type {
  CreateProgramAssignmentInput,
  ProgramAssignment,
} from "@/interfaces/program-assignment";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/assignments`;

export async function getProgramAssignments(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramAssignment[]>(programUrl(programId)),
  );
}

export async function createProgramAssignment(
  programId: string,
  input: CreateProgramAssignmentInput,
) {
  return requireSuccess(
    await httpClient.post<ProgramAssignment>(programUrl(programId), input),
  );
}
