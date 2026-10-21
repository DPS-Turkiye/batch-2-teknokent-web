import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { removeProgramStartup } from "@/lib/api/programs";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

type RouteContext = {
  params: Promise<{ id: string; organizationId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, organizationId } = await context.params;
    return backendResponse(
      await removeProgramStartup(auth.session.userId, id, organizationId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupRemoveFailed"),
    });
  }
}
