import type { MentorProfile } from "@/interfaces/mentor";
import type { MentorRating } from "@/interfaces/mentor-rating";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getMentors() {
  return requireSuccess(await backendHttp.get<MentorProfile[]>("/api/mentors"));
}

export async function getMentorRating(mentorId: string) {
  return requireSuccess(
    await backendHttp.get<MentorRating>(
      `/api/mentors/${encodeURIComponent(mentorId)}/rating`,
    ),
  );
}
