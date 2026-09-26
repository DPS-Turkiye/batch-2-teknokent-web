import { setCoordinatorProgramArchived } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await setCoordinatorProgramArchived(
        auth.session.userId,
        id,
        body.archived === true,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Program arşivlenemedi." });
  }
}
