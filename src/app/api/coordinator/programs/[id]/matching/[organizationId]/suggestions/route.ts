import { fetchMatchSuggestions } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; organizationId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, organizationId } = await params;
    return backendResponse(
      await fetchMatchSuggestions(auth.session.userId, id, organizationId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor önerileri yüklenemedi.",
    });
  }
}
