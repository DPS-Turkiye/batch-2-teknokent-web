import { fetchProgramWithoutTeam } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramWithoutTeam(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("approvalsLoadFailed"),
    });
  }
}
