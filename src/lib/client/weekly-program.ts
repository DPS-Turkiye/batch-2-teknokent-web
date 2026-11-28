import type {
  SaveWeeklyProgramInput,
  WeeklyProgramProposal,
  WeeklyProgramSaved,
} from "@/interfaces/weekly-program";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";

const weeklyProgramUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weekly-program`;

/** Reading runs OCR and an AI call, so it gets an upload's timeout; the backend counts it against the reader. */
export async function readWeeklyProgram(programId: string, documentId: string) {
  return requireSuccess(
    await backendHttp.post<WeeklyProgramProposal>(
      `${weeklyProgramUrl(programId)}/read`,
      { documentId },
      { timeout: UPLOAD_TIMEOUT_MS },
    ),
  );
}

export async function saveWeeklyProgram(
  programId: string,
  input: SaveWeeklyProgramInput,
) {
  return requireSuccess(
    await backendHttp.put<WeeklyProgramSaved>(
      weeklyProgramUrl(programId),
      input,
    ),
  );
}
