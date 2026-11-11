import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/http-client";
import {
  MentorshipRequestSubmissionError,
  submitMentorshipRequest,
  type MentorshipRequestSubmission,
} from "@/lib/mentorship-requests";
import {
  MentorMeetingMode,
  MentorRequestUrgency,
  MentorshipFormat,
} from "@/types/mentor-request";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({
  httpClient: { post: vi.fn() },
}));

const submission: MentorshipRequestSubmission = {
  mentorId: "mentor-1",
  requestedForName: "Orbit",
  supportArea: "Fonlama",
  summary: "Tohum yatırım turu",
  urgency: MentorRequestUrgency.ThisMonth,
  mentorshipFormat: MentorshipFormat.ShortTerm,
  meetingMode: MentorMeetingMode.Online,
  requesterMessage: "Merhaba",
  expectedOutcome: "Yatırımcı listesi",
  recommendationSnapshot: {
    matchingMethod: "PROFILE",
    generatedAt: "2026-11-10T08:00:00Z",
    startupName: "Orbit",
    startupSector: "Fintech",
    startupStage: "MVP",
    startupSummary: "Ödeme altyapısı",
    startupTechnologies: ["Go"],
    recommendations: [],
  },
};

describe("submitMentorshipRequest", () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
  });

  it("posts the request and answers the saved id and status", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse({ id: "req-1", status: "PENDING" }, 201),
    );

    await expect(submitMentorshipRequest(submission)).resolves.toEqual({
      id: "req-1",
      status: "PENDING",
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentor-requests",
      submission,
    );
  });

  it("turns the server's refusal into a submission error carrying its message", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(
        { message: "Bu mentöre zaten talep gönderdiniz." },
        409,
      ),
    );

    const failure = submitMentorshipRequest(submission);

    await expect(failure).rejects.toBeInstanceOf(
      MentorshipRequestSubmissionError,
    );
    await expect(failure).rejects.toThrow(
      "Bu mentöre zaten talep gönderdiniz.",
    );
  });

  it("turns a transport failure into a submission error", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(new Error("Ağ hatası"));

    await expect(submitMentorshipRequest(submission)).rejects.toThrow(
      new MentorshipRequestSubmissionError("Ağ hatası"),
    );
  });

  it("falls back to a generic message for a thrown non-error", async () => {
    vi.mocked(httpClient.post).mockRejectedValue("boom");

    await expect(submitMentorshipRequest(submission)).rejects.toThrow(
      "Talep kaydedilemedi. Lütfen tekrar deneyin.",
    );
  });

  it.each([
    ["an empty body", ""],
    ["a body without an id", { status: "PENDING" }],
    ["a body with a numeric id", { id: 7, status: "PENDING" }],
    ["a body without a status", { id: "req-1" }],
  ])(
    "says the request was saved but unconfirmed for %s",
    async (_label, body) => {
      vi.mocked(httpClient.post).mockResolvedValue(
        createAxiosResponse(body, 201),
      );

      await expect(submitMentorshipRequest(submission)).rejects.toThrow(
        new MentorshipRequestSubmissionError(
          "Talep kaydedildi ancak sunucu yanıtı doğrulanamadı.",
        ),
      );
    },
  );
});
