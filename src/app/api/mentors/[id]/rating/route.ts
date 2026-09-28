import { fetchMentorRating } from "@/lib/api/mentors";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchMentorRating(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Değerlendirme yüklenemedi.",
    });
  }
}
