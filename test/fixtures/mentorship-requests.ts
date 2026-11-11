import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

/** A startup's pending request to Ece Demir, with no messages or matching snapshot yet. */
export function mentorshipRequest(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "mentee-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Ece Demir",
    supportArea: "Yazılım",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-15T00:00:00.000Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}
