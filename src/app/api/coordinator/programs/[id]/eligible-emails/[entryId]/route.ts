import { removeProgramEligibleEmail } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, entryId } = await params;
    return backendResponse(
      await removeProgramEligibleEmail(auth.session.userId, id, entryId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("eligibleEmailsSaveFailed"),
    });
  }
}
