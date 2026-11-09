import type {
  SaveTrainingInput,
  TrainingModuleForEditor,
} from "@/interfaces/training";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const editorUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/training`;

export async function getTrainingForEditor(programId: string) {
  return requireSuccess(
    await httpClient.get<TrainingModuleForEditor>(editorUrl(programId)),
  );
}

export async function putTraining(programId: string, input: SaveTrainingInput) {
  return requireSuccess(
    await httpClient.put<TrainingModuleForEditor>(editorUrl(programId), input),
  );
}
