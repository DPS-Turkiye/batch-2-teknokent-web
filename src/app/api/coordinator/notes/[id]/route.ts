import { deleteCoordinatorNote } from "@/lib/api/coordinator-notes";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await deleteCoordinatorNote(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Not silinemedi." });
  }
}
