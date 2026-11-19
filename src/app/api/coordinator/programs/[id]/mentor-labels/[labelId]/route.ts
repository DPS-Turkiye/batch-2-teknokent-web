import { deleteMentorLabel, updateMentorLabel } from "@/lib/api/mentor-labels";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { mentorLabelSchema } from "@/lib/server/mentor-label-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; labelId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, labelId } = await params;
    const body = await readJsonBody(request, mentorLabelSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateMentorLabel(auth.session.userId, id, labelId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelSaveFailed"),
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, labelId } = await params;
    return backendResponse(
      await deleteMentorLabel(auth.session.userId, id, labelId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelDeleteFailed"),
    });
  }
}
