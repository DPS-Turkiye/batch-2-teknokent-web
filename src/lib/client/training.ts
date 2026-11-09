import type {
  SaveTrainingInput,
  StudentTraining,
  TrainingAttemptResult,
  TrainingModuleForEditor,
  TrainingQuiz,
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

export async function getStudentTraining() {
  return requireSuccess(
    await httpClient.get<StudentTraining>("/api/training/peer"),
  );
}

export async function postVideoWatched() {
  return requireSuccess(
    await httpClient.post<StudentTraining>("/api/training/peer/video-watched"),
  );
}

export async function getTrainingQuiz() {
  return requireSuccess(
    await httpClient.get<TrainingQuiz>("/api/training/peer/quiz"),
  );
}

export async function postTrainingAttempt(
  version: number,
  answers: Record<string, number>,
) {
  return requireSuccess(
    await httpClient.post<TrainingAttemptResult>(
      "/api/training/peer/attempts",
      {
        version,
        answers,
      },
    ),
  );
}
