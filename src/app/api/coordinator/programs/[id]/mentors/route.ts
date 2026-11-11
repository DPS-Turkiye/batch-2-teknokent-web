import { z } from "zod";

import {
  fetchMentorPool,
  inviteProgramMentor,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const inviteMentorSchema = z.object({ email: z.string() });

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
    const body = await readJsonBody(request, inviteMentorSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await inviteProgramMentor(auth.session.userId, id, body.data.email),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorInviteFailed"),
    });
  }
}
