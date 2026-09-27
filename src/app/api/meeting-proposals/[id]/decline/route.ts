import { declineMeetingProposal } from "@/lib/api/meeting-proposals";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return backendResponse(
      await declineMeetingProposal(userId, id, body.reason ?? null),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Yanıt gönderilemedi." });
  }
}
