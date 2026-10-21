import {
  fetchMentorPool,
  inviteProgramMentor,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchMentorPool(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorPoolLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await inviteProgramMentor(
        auth.session.userId,
        id,
        String(body.email ?? ""),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorInviteFailed"),
    });
  }
}
