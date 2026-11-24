import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingEvaluationView } from "@/components/mentor-evaluation/meeting-evaluation-view";
import { useMentorMeetingEvaluation } from "@/hooks/use-mentor-meeting-evaluation";
import { MeetingStatus } from "@/interfaces/meeting";
import { OutcomeClarity } from "@/types/mentor-evaluation";
import { InLocale } from "@test/test-utils";

vi.mock("@/hooks/use-mentor-meeting-evaluation", () => ({
  useMentorMeetingEvaluation: vi.fn(),
}));

type Evaluation = ReturnType<typeof useMentorMeetingEvaluation>;

const handlers = {
  setClarity: vi.fn(),
  setNote: vi.fn(),
  setPreparedness: vi.fn(),
  submit: vi.fn(),
  toggleQuality: vi.fn(),
  confirmHeld: vi.fn(),
  undoHeld: vi.fn(),
  openNoShow: vi.fn(),
  closeNoShow: vi.fn(),
  setNoShowNote: vi.fn(),
  confirmNoShow: vi.fn(),
  undoNoShow: vi.fn(),
};

function state(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    answers: { preparedness: null, qualities: [], clarity: null, note: "" },
    answered: 0,
    canSubmit: false,
    error: null,
    held: false,
    heldError: null,
    isSavingHeld: false,
    noShow: false,
    noShowError: null,
    noShowNote: "",
    noShowOpen: false,
    isSavingNoShow: false,
    isLoading: false,
    isSubmitting: false,
    isSent: false,
    meeting: {
      id: "m1",
      organizationId: "org-1",
      scheduledAt: "2026-09-05T11:00:00Z",
      durationMinutes: 45,
      status: MeetingStatus.Completed,
    },
    meta: "Döngü · Gülse · UX Flow Review · 5 Eylül · 14:00 · 45 dk",
    startupInitials: "DÖ",
    startupName: "Döngü",
    ...handlers,
    ...overrides,
  };
}

describe("MeetingEvaluationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(state());
  });

  it("asks the three questions with the send button held until all are answered", () => {
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.getByRole("heading", { name: "Bu görüşme nasıl geçti?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Döngü · Gülse · UX Flow Review · 5 Eylül · 14:00 · 45 dk",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluklarım" }),
    ).toHaveAttribute("href", "/mentorships");
    expect(screen.getAllByRole("button", { name: /\/ 5$/ })).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Motivasyonu yüksek" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kısmen" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Değerlendirmeyi gönder" }),
    ).toBeDisabled();
    expect(screen.getByText(/0\/3 soru yanıtlandı/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Daha sonra" })).toHaveAttribute(
      "href",
      "/mentor-dashboard",
    );
  });

  it("reads in English and still sends the saved Turkish quality", async () => {
    const user = userEvent.setup();
    render(
      <InLocale locale="en">
        <MeetingEvaluationView meetingId="m1" />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", { name: "How did this meeting go?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Partly" })).toBeInTheDocument();
    expect(screen.getByText("0/3 questions answered")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Engaged" }));
    expect(handlers.toggleQuality).toHaveBeenCalledWith("Aktif katılım");
  });

  it("passes each answer to the hook", async () => {
    const user = userEvent.setup();
    render(<MeetingEvaluationView meetingId="m1" />);

    await user.click(screen.getByRole("button", { name: "4 / 5" }));
    await user.click(screen.getByRole("button", { name: "Hazırlıklı" }));
    await user.click(screen.getByRole("button", { name: "Hayır" }));
    await user.type(
      screen.getByRole("textbox", { name: /farklı olmasını/ }),
      "x",
    );

    expect(handlers.setPreparedness).toHaveBeenCalledWith(4);
    expect(handlers.toggleQuality).toHaveBeenCalledWith("Hazırlıklı");
    expect(handlers.setClarity).toHaveBeenCalledWith(OutcomeClarity.No);
    expect(handlers.setNote).toHaveBeenCalledWith("x");
  });

  it("marks the chosen answers and sends once complete", async () => {
    const user = userEvent.setup();
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({
        answers: {
          preparedness: 4,
          qualities: ["Hazırlıklı"],
          clarity: OutcomeClarity.Partly,
          note: "",
        },
        answered: 3,
        canSubmit: true,
      }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(screen.getByRole("button", { name: "4 / 5" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Hazırlıklı" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Kısmen" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/3\/3 soru yanıtlandı/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Değerlendirmeyi gönder" }),
    );
    expect(handlers.submit).toHaveBeenCalled();
  });

  it("thanks the mentor once the evaluation is in", () => {
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ isSent: true }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.getByRole("heading", { name: "Değerlendirmeniz alındı." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluklarıma dön" }),
    ).toHaveAttribute("href", "/mentorships");
    expect(
      screen.getByRole("link", { name: "Anasayfaya git" }),
    ).toHaveAttribute("href", "/mentor-dashboard");
  });

  it("says when the meeting cannot be found", () => {
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ meeting: undefined }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(screen.getByText("Görüşme bulunamadı.")).toBeInTheDocument();
  });

  it("lets the mentor confirm the meeting was held, and undo it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MeetingEvaluationView meetingId="m1" />);

    expect(screen.getByText("Bu görüşme yapıldı mı?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Görüşme yapıldı" }));
    expect(handlers.confirmHeld).toHaveBeenCalled();

    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ held: true, isSent: true }),
    );
    rerender(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.getByText("Görüşme yapıldı olarak işaretlendi."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Geri al" }));
    expect(handlers.undoHeld).toHaveBeenCalled();
  });
});

describe("MeetingEvaluationView when the startup did not come", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(state());
  });

  it("offers both outcomes", async () => {
    const user = userEvent.setup();
    render(<MeetingEvaluationView meetingId="m1" />);

    await user.click(
      screen.getByRole("button", { name: "Girişimci katılmadı" }),
    );
    await user.click(screen.getByRole("button", { name: "Görüşme yapıldı" }));

    expect(handlers.openNoShow).toHaveBeenCalledOnce();
    expect(handlers.confirmHeld).toHaveBeenCalledOnce();
  });

  it("asks for an optional note instead of the questions", async () => {
    const user = userEvent.setup();
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ noShowOpen: true }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: /Koordinatöre not/ }),
      "x",
    );
    await user.click(
      screen.getByRole("button", { name: "Katılmadı olarak kaydet" }),
    );
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(handlers.setNoShowNote).toHaveBeenCalledWith("x");
    expect(handlers.confirmNoShow).toHaveBeenCalledOnce();
    expect(handlers.closeNoShow).toHaveBeenCalledOnce();
  });

  it("says it is marked, hides the questions and can be undone", async () => {
    const user = userEvent.setup();
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ noShow: true }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.getByText("“Girişimci katılmadı” olarak işaretlendi."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Geri al" }));

    expect(handlers.undoNoShow).toHaveBeenCalledOnce();
    expect(handlers.undoHeld).not.toHaveBeenCalled();
  });

  it("is not offered once the evaluation is sent", () => {
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ isSent: true }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(
      screen.queryByRole("button", { name: "Girişimci katılmadı" }),
    ).not.toBeInTheDocument();
  });

  it("shows why it could not be saved", () => {
    vi.mocked(useMentorMeetingEvaluation).mockReturnValue(
      state({ noShowOpen: true, noShowError: new Error("Kaydedilemedi.") }),
    );
    render(<MeetingEvaluationView meetingId="m1" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Kaydedilemedi.");
  });
});
