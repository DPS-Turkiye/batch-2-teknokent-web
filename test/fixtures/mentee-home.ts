import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

export function menteeRequestFixture(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "r1",
    requesterId: "mentee-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Barış Öztürk",
    supportArea: "Teknik ekip kurulumu",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-01T10:00:00Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

export function menteeMeetingFixture(
  overrides: Partial<MeetingItem> = {},
): MeetingItem {
  return {
    id: "m1",
    organizationId: "org-1",
    scheduledAt: new Date(2026, 8, 15, 14, 0).toISOString(),
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

export function menteeActionItemFixture(
  overrides: Partial<ActionItem> = {},
): ActionItem {
  return {
    id: "a1",
    organizationId: "org-1",
    ownerId: "mentor-1",
    title: "KPI dosyasını paylaş",
    status: ActionItemStatus.Open,
    dueDate: "2026-09-18",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
    ...overrides,
  };
}
