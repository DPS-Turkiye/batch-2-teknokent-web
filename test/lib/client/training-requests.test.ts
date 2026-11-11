import { beforeEach, describe, vi } from "vitest";

import {
  getStudentTraining,
  getTrainingForEditor,
  getTrainingQuiz,
  postTrainingAttempt,
  postVideoWatched,
  putTraining,
} from "@/lib/client/training";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const training = {
  videoUrl: "https://video.example/intro",
  questions: [
    {
      text: "Akran mentoru ne yapar?",
      options: ["A", "B", "C", "D"] satisfies [string, string, string, string],
      correctOption: 2,
    },
  ],
};

const calls: ClientCall[] = [
  {
    title: "getTrainingForEditor reads the encoded program's training",
    call: () => getTrainingForEditor("prog/1"),
    method: "get",
    args: ["/api/coordinator/programs/prog%2F1/training"],
  },
  {
    title: "putTraining puts the video and questions",
    call: () => putTraining("prog/1", training),
    method: "put",
    args: ["/api/coordinator/programs/prog%2F1/training", training],
  },
  {
    title: "getStudentTraining reads the student's training",
    call: () => getStudentTraining(),
    method: "get",
    args: ["/api/training/peer"],
  },
  {
    title: "postVideoWatched marks the video watched",
    call: () => postVideoWatched(),
    method: "post",
    args: ["/api/training/peer/video-watched"],
  },
  {
    title: "getTrainingQuiz reads the quiz",
    call: () => getTrainingQuiz(),
    method: "get",
    args: ["/api/training/peer/quiz"],
  },
  {
    title: "postTrainingAttempt posts the answers for the quiz version",
    call: () => postTrainingAttempt(3, { q1: 2 }),
    method: "post",
    args: ["/api/training/peer/attempts", { version: 3, answers: { q1: 2 } }],
  },
];

describe("training client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
