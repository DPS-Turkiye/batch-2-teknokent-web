import { fetchMentorDirectory } from "@/lib/api/mentors";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    await getSessionIds();
    return backendResponse(await fetchMentorDirectory());
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorsLoadFailed"),
    });
  }
}
