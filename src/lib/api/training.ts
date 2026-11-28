import "server-only";

import type {
  StudentTraining,
  TrainingAttemptResult,
  TrainingQuiz,
} from "@/interfaces/training";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

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
