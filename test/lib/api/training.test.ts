import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchStudentTraining,
  fetchTrainingForEditor,
  fetchTrainingQuiz,
  reportVideoWatched,
  saveTraining,
  submitTrainingAttempt,
} from "@/lib/api/training";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads the coordinator's training editor for an encoded program",
    () => fetchTrainingForEditor("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/training",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "saves the training with the actor added to the body",
    () =>
      saveTraining("coord-1", "prog/1", {
        videoUrl: "https://youtu.be/abc",
        questions: [],
      }),
    {
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/training",
      data: {
        videoUrl: "https://youtu.be/abc",
        questions: [],
        actorId: "coord-1",
      },
    },
  ],
  [
    "reads where the student stands with the training",
    () => fetchStudentTraining("student-1"),
    {
      method: "GET",
      url: "/api/training/peer",
      params: { actorId: "student-1" },
    },
  ],
  [
    "reports the video as watched with the actor in the body",
    () => reportVideoWatched("student-1"),
    {
      method: "POST",
      url: "/api/training/peer/video-watched",
      data: { actorId: "student-1" },
    },
  ],
  [
    "reads the quiz",
    () => fetchTrainingQuiz("student-1"),
    {
      method: "GET",
      url: "/api/training/peer/quiz",
      params: { actorId: "student-1" },
    },
  ],
  [
    "submits an attempt with the quiz version and the chosen options",
    () => submitTrainingAttempt("student-1", 3, { "q-1": 2, "q-2": 0 }),
    {
      method: "POST",
      url: "/api/training/peer/attempts",
      data: {
        actorId: "student-1",
        version: 3,
        answers: { "q-1": 2, "q-2": 0 },
      },
    },
  ],
];

describe("training server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
