import type { MentorEvidence } from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import type {
  MentorMeetingMode,
  MentorRequestUrgency,
  MentorshipFormat,
} from "@/types/mentor-request";

export type MentorshipRequestSubmission = {
  mentorId: string;
  requestedForName: string;
  supportArea: string;
  summary: string;
  urgency: MentorRequestUrgency;
  mentorshipFormat: MentorshipFormat;
  meetingMode: MentorMeetingMode;
  requesterMessage: string;
  expectedOutcome: string;
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
  let responseBody: unknown;
  try {
    responseBody = requireSuccess(
      // The requester and their startup are the caller's own: the backend takes both from the session.
      await backendHttp.post<MentorshipRequestSubmissionResponse>(
        "/api/mentorship-requests",
        request,
      ),
    );
  } catch (error) {
    throw new MentorshipRequestSubmissionError(
      error instanceof Error
        ? error.message
        : "Talep kaydedilemedi. Lütfen tekrar deneyin.",
    );
  }

  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    typeof (responseBody as Record<string, unknown>).id !== "string" ||
    typeof (responseBody as Record<string, unknown>).status !== "string"
  ) {
    throw new MentorshipRequestSubmissionError(
      "Talep kaydedildi ancak sunucu yanıtı doğrulanamadı.",
    );
  }

  return responseBody as MentorshipRequestSubmissionResponse;
}
