import { fetchMentorDirectory } from "@/lib/api/mentors";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    await getSessionIds();
    return backendResponse(await fetchMentorDirectory());
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorlar yüklenemedi.",
    });
  }
}
