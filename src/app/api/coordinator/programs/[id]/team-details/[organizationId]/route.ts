import { fetchProgramTeamDetail } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; organizationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, organizationId } = await params;
    return backendResponse(
      await fetchProgramTeamDetail(auth.session.userId, id, organizationId),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Takım detayı yüklenemedi." });
  }
}
