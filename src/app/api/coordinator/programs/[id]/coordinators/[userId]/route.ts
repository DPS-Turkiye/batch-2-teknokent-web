import { removeProgramCoordinator } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

// Only admins change who runs a program; the backend refuses anyone else.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const auth = await requireAdminSession();
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
