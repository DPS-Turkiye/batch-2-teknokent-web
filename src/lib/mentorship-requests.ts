import type { MentorEvidence } from "@/interfaces/mentor";

export type MentorshipRequestSubmission = {
  mentorId: string;
  requestedForName: string;
  supportArea: string;
  summary: string;
  urgency: "THIS_WEEK" | "NEXT_TWO_WEEKS" | "THIS_MONTH" | "NOT_URGENT";
  mentorshipFormat:
    "SINGLE_MEETING" | "SHORT_TERM" | "REGULAR" | "EXPERT_REFERRAL";
  meetingMode: "ONLINE" | "IN_PERSON" | "NO_PREFERENCE";
  requesterMessage: string;
  recommendationSnapshot: {
    matchingMethod: string;
    matchingModel?: string;
    generatedAt: string;
    startupName: string;
    startupSector: string;
    startupStage: string;
    startupSummary: string;
    startupTechnologies: string[];
    recommendations: Array<{
      mentorId: string;
      rank: number;
      selected: boolean;
      mentorName: string;
      professionalTitle: string;
      company: string;
      reasons: string[];
      evidence: MentorEvidence[];
    }>;
  };
};

type MentorshipRequestSubmissionResponse = {
  id: string;
  status: string;
};

export class MentorshipRequestSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MentorshipRequestSubmissionError";
  }
}

export async function submitMentorshipRequest(
  request: MentorshipRequestSubmission,
): Promise<MentorshipRequestSubmissionResponse> {
  const response = await fetch("/api/mentor-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      responseBody &&
      typeof responseBody === "object" &&
      "message" in responseBody &&
      typeof responseBody.message === "string"
        ? responseBody.message
        : "Talep kaydedilemedi. Lütfen tekrar deneyin.";
    throw new MentorshipRequestSubmissionError(message);
  }

  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    typeof (responseBody as Record<string, unknown>).id !== "string" ||
    typeof (responseBody as Record<string, unknown>).status !== "string"
  ) {
    throw new MentorshipRequestSubmissionError(
      "Talep kaydedildi ancak yanıt doğrulanamadı.",
    );
  }

  return responseBody as MentorshipRequestSubmissionResponse;
}
