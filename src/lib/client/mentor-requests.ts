import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { MentorProfile } from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMentorRequests(role: "mentee" | "mentor" = "mentee") {
  return requireSuccess(
    await httpClient.get<MentorshipRequest[]>("/api/mentor-requests", {
      params: role === "mentor" ? { role } : undefined,
    }),
  );
}

export async function getMentorRequest(id: string) {
  return requireSuccess(
    await httpClient.get<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(id)}`,
    ),
  );
}

export async function replyToMentorRequest(options: {
  id: string;
  message: string;
}) {
  return requireSuccess(
    await httpClient.post<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/messages`,
      { message: options.message },
    ),
  );
}

export async function withdrawMentorRequest(id: string) {
  return requireSuccess(
    await httpClient.patch<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(id)}/withdrawal`,
      {},
    ),
  );
}

export type MentorAvailabilitySlot = {
  id: string;
  startsAt: string;
  durationMinutes: number;
};

export async function getMentorAvailability(id: string) {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySlot[]>(
      `/api/mentor-requests/${encodeURIComponent(id)}/availability`,
    ),
  );
}

export async function getAlternativeMentors(id: string) {
  return requireSuccess(
    await httpClient.get<MentorProfile[]>(
      `/api/mentor-requests/${encodeURIComponent(id)}/alternatives`,
    ),
  );
}

export async function decideMentorRequest(options: {
  id: string;
  mentorId: string;
  message: string;
  status: MentorshipRequest["status"];
}) {
  return requireSuccess(
    await httpClient.patch<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/decision`,
      {
        mentorId: options.mentorId,
        status: options.status,
        message: options.message,
      },
    ),
  );
}
