import type { MentorAvailabilitySlot } from "@/interfaces/mentor-availability";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getOwnMentorAvailability(mentorId: string) {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySlot[]>(
      `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    ),
  );
}

export async function createMentorAvailabilitySlot(options: {
  mentorId: string;
  startsAt: string;
  durationMinutes?: number;
}) {
  return requireSuccess(
    await httpClient.post<MentorAvailabilitySlot>(
      `/api/mentors/${encodeURIComponent(options.mentorId)}/availability`,
      {
        startsAt: options.startsAt,
        durationMinutes: options.durationMinutes,
      },
    ),
  );
}

export async function deleteMentorAvailabilitySlot(options: {
  mentorId: string;
  slotId: string;
}) {
  return requireSuccess(
    await httpClient.delete(
      `/api/mentors/${encodeURIComponent(options.mentorId)}/availability/${encodeURIComponent(options.slotId)}`,
    ),
  );
}
