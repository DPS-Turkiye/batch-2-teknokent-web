import { setMentorLabels } from "@/lib/api/mentor-labels";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { mentorLabelIdsSchema } from "@/lib/server/mentor-label-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await params;
    const body = await readJsonBody(request, mentorLabelIdsSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await setMentorLabels(
        auth.session.userId,
        id,
        mentorId,
        body.data.labelIds,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelSaveFailed"),
    });
  }
}
