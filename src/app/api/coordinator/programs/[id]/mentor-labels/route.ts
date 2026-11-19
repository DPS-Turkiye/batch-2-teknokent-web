import {
  createMentorLabel,
  fetchMentorLabelBoard,
} from "@/lib/api/mentor-labels";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { mentorLabelSchema } from "@/lib/server/mentor-label-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchMentorLabelBoard(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelsLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, mentorLabelSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createMentorLabel(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelSaveFailed"),
    });
  }
}
