import type { MentorProfile } from "@/interfaces/mentor";
import type { MentorRating } from "@/interfaces/mentor-rating";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMentors() {
  return requireSuccess(await httpClient.get<MentorProfile[]>("/api/mentors"));
}

export async function getMentorRating(mentorId: string) {
  return requireSuccess(
    await httpClient.get<MentorRating>(
      `/api/mentors/${encodeURIComponent(mentorId)}/rating`,
    ),
  );
}
