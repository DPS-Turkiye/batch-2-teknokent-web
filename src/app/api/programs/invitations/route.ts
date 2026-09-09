import { fetchProgramInvitations } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";

export async function GET() {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchProgramInvitations(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Program davetleri yüklenemedi.",
    });
  }
}
