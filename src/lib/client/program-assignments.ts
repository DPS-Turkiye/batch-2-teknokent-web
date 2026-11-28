import type {
  CreateProgramAssignmentInput,
  ProgramAssignment,
  UpdateProgramAssignmentInput,
} from "@/interfaces/program-assignment";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/assignments`;

export async function getProgramAssignments(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramAssignment[]>(programUrl(programId)),
  );
}

export async function createProgramAssignment(
  programId: string,
  input: CreateProgramAssignmentInput,
) {
  return requireSuccess(
    await backendHttp.post<ProgramAssignment>(programUrl(programId), input),
  );
}

export async function updateProgramAssignment(
  programId: string,
  assignmentId: string,
  input: UpdateProgramAssignmentInput,
) {
  return requireSuccess(
    await backendHttp.put<ProgramAssignment>(
      `${programUrl(programId)}/${encodeURIComponent(assignmentId)}`,
      input,
    ),
  );
}

export async function deleteProgramAssignment(
  programId: string,
  assignmentId: string,
) {
  requireSuccess(
    await backendHttp.delete<null>(
      `${programUrl(programId)}/${encodeURIComponent(assignmentId)}`,
    ),
  );
}
