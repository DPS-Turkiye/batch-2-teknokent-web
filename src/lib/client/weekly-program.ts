import type {
  SaveWeeklyProgramInput,
  WeeklyProgramProposal,
  WeeklyProgramSaved,
} from "@/interfaces/weekly-program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient, UPLOAD_TIMEOUT_MS } from "@/lib/http-client";

const weeklyProgramUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weekly-program`;

/** Reading runs OCR and an AI call, so it gets an upload's timeout. */
export async function readWeeklyProgram(programId: string, documentId: string) {
  return requireSuccess(
    await httpClient.post<WeeklyProgramProposal>(
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
    await httpClient.put<WeeklyProgramSaved>(
      weeklyProgramUrl(programId),
      input,
    ),
  );
}
