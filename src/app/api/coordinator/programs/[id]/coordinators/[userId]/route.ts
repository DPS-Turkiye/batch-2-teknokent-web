import { removeProgramCoordinator } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, userId } = await params;
    return backendResponse(
      await removeProgramCoordinator(auth.session.userId, id, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorRemoveFailed"),
    });
  }
}
