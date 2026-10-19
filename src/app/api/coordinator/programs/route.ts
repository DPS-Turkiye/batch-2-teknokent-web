import {
  createCoordinatorProgram,
  fetchCoordinatorPrograms,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET() {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchCoordinatorPrograms(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programsLoadFailed"),
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const body = await request.json();
    return backendResponse(
      await createCoordinatorProgram(auth.session.userId, body),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programCreateFailed"),
    });
  }
}
