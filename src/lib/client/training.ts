import type {
  SaveTrainingInput,
  StudentTraining,
  TrainingAttemptResult,
  TrainingModuleForEditor,
  TrainingQuiz,
} from "@/interfaces/training";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
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

// The student's own training: the backend takes the student from the session.
export async function getStudentTraining() {
  return requireSuccess(
    await backendHttp.get<StudentTraining>("/api/training/peer"),
  );
}

export async function postVideoWatched() {
  return requireSuccess(
    await backendHttp.post<StudentTraining>("/api/training/peer/video-watched"),
  );
}

export async function getTrainingQuiz() {
  return requireSuccess(
    await backendHttp.get<TrainingQuiz>("/api/training/peer/quiz"),
  );
}

export async function postTrainingAttempt(
  version: number,
  answers: Record<string, number>,
) {
  return requireSuccess(
    await backendHttp.post<TrainingAttemptResult>(
      "/api/training/peer/attempts",
      {
        version,
        answers,
      },
    ),
  );
}
