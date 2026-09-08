import { requestProgramMembership } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    return backendResponse(
      await requestProgramMembership(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Program katılım talebi gönderilemedi.",
    });
  }
}
