export type {
  AddBotResult,
  Meeting,
  MeetingStatusBg,
  MeetingStatusColor,
  MeetingStatusMeta,
  TranscriptLine,
  TranscriptSegment,
} from "@/types/assistant";
export { BotStatus, MeetingPlatform, MeetingStatus } from "@/types/assistant";

export type {
  BackendHealthResult,
  HealthComponentsResponse,
  HealthResponse,
  UseHealthStatusResult,
} from "@/interfaces/health";
export { HealthStatus, isHealthStatus } from "@/interfaces/health";
export { AppArea } from "@/types/app-area";
export type {
  DashboardNotification,
  LandingAnnouncement,
  LandingFaq,
  LandingMentorStep,
  LandingProgram,
  LandingTraining,
  LandingTrainingCategory,
} from "@/types/landing";
export type { MentorRequestMentor } from "@/types/mentor-request";
export { MentorRequestStep } from "@/types/mentor-request";
export { LoginFlowStep, LoginRoleId } from "@/interfaces/login";
export type { LoginRoleGroup, LoginRoleOption } from "@/interfaces/login";
