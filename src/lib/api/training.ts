import "server-only";

import type {
  SaveTrainingInput,
  StudentTraining,
  TrainingAttemptResult,
  TrainingModuleForEditor,
  TrainingQuiz,
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

const STUDENT = "/api/training/peer";

export function fetchStudentTraining(actorId: string) {
  return backendRequest<StudentTraining>({
    method: HttpMethod.Get,
    url: STUDENT,
    params: { actorId },
  });
}

export function reportVideoWatched(actorId: string) {
  return backendRequest<StudentTraining>({
    method: HttpMethod.Post,
    url: `${STUDENT}/video-watched`,
    data: { actorId },
  });
}

export function fetchTrainingQuiz(actorId: string) {
  return backendRequest<TrainingQuiz>({
    method: HttpMethod.Get,
    url: `${STUDENT}/quiz`,
    params: { actorId },
  });
}

export function submitTrainingAttempt(
  actorId: string,
  version: number,
  answers: Record<string, number>,
) {
  return backendRequest<TrainingAttemptResult>({
    method: HttpMethod.Post,
    url: `${STUDENT}/attempts`,
    data: { actorId, version, answers },
  });
}
