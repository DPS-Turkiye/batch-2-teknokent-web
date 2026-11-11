import type { MentorProfile } from "@/interfaces/mentor";
import { MatchingMethod } from "@/interfaces/mentorship-request";
import type { StartupContext } from "@/interfaces/startup";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import type {
  MentorMeetingMode,
  MentorRequestUrgency,
  MentorshipFormat,
} from "@/types/mentor-request";

function headerText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export type RecommendationMetadata = {
  generatedAt: string;
  matchingMethod: string;
  matchingModel?: string | undefined;
};

export type RecommendationSpecification = {
  excludedMentorId?: string | undefined;
  meetingMode: MentorMeetingMode;
  mentorshipFormat: MentorshipFormat;
  startup: StartupContext;
  summary: string;
  supportArea: string;
  urgency: MentorRequestUrgency;
};

export async function getMentorRecommendations(
  specification: RecommendationSpecification,
) {
  const response = await httpClient.post<MentorProfile[]>(
    "/api/mentor-recommendations",
    {
      supportArea: specification.supportArea,
      summary: specification.summary,
      urgency: specification.urgency,
      mentorshipFormat: specification.mentorshipFormat,
      meetingMode: specification.meetingMode,
      startupSector: specification.startup.sector,
      startupStage: specification.startup.stage,
      startupSummary: specification.startup.summary,
      startupTechnologies: specification.startup.technologies,
      excludedMentorId: specification.excludedMentorId,
    },
  );

  const mentors = requireSuccess(response);
  return {
    mentors,
    metadata: {
      matchingMethod:
        headerText(response.headers["x-matching-method"]) ??
        MatchingMethod.Deterministic,
      matchingModel:
        headerText(response.headers["x-matching-model"]) || undefined,
      generatedAt:
        headerText(response.headers["x-recommendation-generated-at"]) ??
        new Date().toISOString(),
    } satisfies RecommendationMetadata,
  };
}
