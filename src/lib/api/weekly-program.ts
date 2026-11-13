import "server-only";

import type {
  SaveWeeklyProgramInput,
  WeeklyProgramProposal,
  WeeklyProgramSaved,
} from "@/interfaces/weekly-program";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const weeklyProgramUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weekly-program`;

/**
 * OCR and the AI call can outlast the default timeout, as an upload does. The read goes on the service
 * credentials like every coordinator call: the backend only lets a bearer token reach the paths the browser
 * calls itself, and refuses one here with 403.
 */
export function readWeeklyProgram(
  actorId: string,
  programId: string,
  documentId: string,
) {
  return backendRequest<WeeklyProgramProposal>({
    method: HttpMethod.Post,
    url: `${weeklyProgramUrl(programId)}/read`,
    data: { actorId, documentId },
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

export function saveWeeklyProgram(
  actorId: string,
  programId: string,
  input: SaveWeeklyProgramInput,
) {
  return backendRequest<WeeklyProgramSaved>({
    method: HttpMethod.Put,
    url: weeklyProgramUrl(programId),
    data: { actorId, ...input },
  });
}
