import "server-only";

import type {
  SaveTrainingInput,
  TrainingModuleForEditor,
} from "@/interfaces/training";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const editorUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/training`;

export function fetchTrainingForEditor(actorId: string, programId: string) {
  return backendRequest<TrainingModuleForEditor>({
    method: HttpMethod.Get,
    url: editorUrl(programId),
    params: { actorId },
  });
}

export function saveTraining(
  actorId: string,
  programId: string,
  input: SaveTrainingInput,
) {
  return backendRequest<TrainingModuleForEditor>({
    method: HttpMethod.Put,
    url: editorUrl(programId),
    data: { ...input, actorId },
  });
}
