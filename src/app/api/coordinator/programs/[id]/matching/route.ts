import { createMatch, fetchMatching } from "@/lib/api/coordinator-programs";
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
    return backendResponse(await fetchMatching(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("matchesLoadFailed"),
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
      await createMatch(auth.session.userId, id, {
        organizationId: String(body.organizationId ?? ""),
        mentorId: String(body.mentorId ?? ""),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("matchCreateFailed"),
    });
  }
}
