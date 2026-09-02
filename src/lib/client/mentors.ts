import type { MentorProfile } from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMentors() {
  return requireSuccess(await httpClient.get<MentorProfile[]>("/api/mentors"));
}
