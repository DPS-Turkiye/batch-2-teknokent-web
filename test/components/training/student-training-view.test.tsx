import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentTrainingView } from "@/components/training/student-training-view";
import { TrainingState, type StudentTraining } from "@/interfaces/training";
import {
  getStudentTraining,
  getTrainingQuiz,
  postTrainingAttempt,
  postVideoWatched,
} from "@/lib/client/training";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/training", () => ({
  getStudentTraining: vi.fn(),
  getTrainingQuiz: vi.fn(),
  postTrainingAttempt: vi.fn(),
  postVideoWatched: vi.fn(),
}));
vi.mock("@/components/training/training-video", () => ({
  TrainingVideo: ({ onWatched }: { onWatched: () => void }) => (
    <button type="button" onClick={onWatched}>
      video ended
    </button>
  ),
}));

function training(overrides: Partial<StudentTraining>): StudentTraining {
  return {
    state: TrainingState.Video,
    programId: "p1",
    programName: "İŞKUR 2026 Bahar",
    version: 1,
    videoId: "M7lc1UVf-VE",
    videoWatched: false,
    attemptsLeft: 3,
    nextAttemptAt: null,
    lastScore: null,
    passMark: 8,
    questionCount: 2,
    ...overrides,
  };
}

const quiz = {
  version: 1,
  questions: [
    {
      id: "q1",
      text: "Birinci soru",
      options: [
        { index: 2, text: "Doğru" },
        { index: 0, text: "Yanlış" },
      ],
    },
    {
      id: "q2",
      text: "İkinci soru",
      options: [
        { index: 1, text: "Evet" },
        { index: 3, text: "Hayır" },
      ],
    },
  ],
};

describe("StudentTrainingView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the quiz once the video counts as watched", async () => {
    vi.mocked(getStudentTraining).mockResolvedValue(training({}));
    vi.mocked(postVideoWatched).mockResolvedValue(
      training({ state: TrainingState.Quiz, videoWatched: true }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentTrainingView />);

    expect(await screen.findByText("1. Videoyu izle")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "video ended" }));

    await waitFor(() => expect(postVideoWatched).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole("button", { name: "Sınava başla" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bugün 3 deneme hakkın var.")).toBeInTheDocument();
  });

  // Answers go back as question id → the option's own index, whatever order it was shown in.
  it("sends every answer by the option's index and shows the score", async () => {
    vi.mocked(getStudentTraining).mockResolvedValue(
      training({ state: TrainingState.Quiz, videoWatched: true }),
    );
    vi.mocked(getTrainingQuiz).mockResolvedValue(quiz);
    vi.mocked(postTrainingAttempt).mockResolvedValue({
      score: 2,
      passed: true,
      training: training({ state: TrainingState.BadgeActive }),
    });
    const user = userEvent.setup();
    renderWithQueryClient(<StudentTrainingView />);

    await user.click(
      await screen.findByRole("button", { name: "Sınava başla" }),
    );
    const submit = await screen.findByRole("button", { name: "Gönder" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText("Doğru"));
    await user.click(screen.getByLabelText("Hayır"));
    await user.click(submit);

    await waitFor(() =>
      expect(postTrainingAttempt).toHaveBeenCalledWith(1, { q1: 2, q2: 3 }),
    );
    expect(
      await screen.findByText("Tebrikler, Akran Mentoru rozetini kazandın!"),
    ).toBeInTheDocument();
    expect(screen.getByText("2/2 doğru")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluk Ver’e git" }),
    ).toHaveAttribute("href", "/student/peer-mentoring?as=MENTOR");
  });

  it("says when today's attempts are used up", async () => {
    vi.mocked(getStudentTraining).mockResolvedValue(
      training({
        state: TrainingState.Quiz,
        attemptsLeft: 0,
        nextAttemptAt: "2026-11-09T10:00:00Z",
      }),
    );
    renderWithQueryClient(<StudentTrainingView />);

    expect(
      await screen.findByText(/Bugünkü deneme hakların bitti/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sınava başla" }),
    ).not.toBeInTheDocument();
  });

  it("explains a training that is not open, and a badge that was taken back", async () => {
    vi.mocked(getStudentTraining).mockResolvedValue(
      training({ state: TrainingState.NotAvailable }),
    );
    const first = renderWithQueryClient(<StudentTrainingView />);
    expect(
      await screen.findByText(/Eğitim henüz hazır değil/),
    ).toBeInTheDocument();
    first.unmount();

    vi.mocked(getStudentTraining).mockResolvedValue(
      training({ state: TrainingState.Blocked }),
    );
    renderWithQueryClient(<StudentTrainingView />);
    expect(
      await screen.findByText(/eğitimle yeniden kazanamazsın/),
    ).toBeInTheDocument();
  });
});
