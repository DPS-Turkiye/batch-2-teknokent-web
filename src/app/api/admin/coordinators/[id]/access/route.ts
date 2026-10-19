import { setCoordinatorAccess } from "@/lib/api/admin-coordinators";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await setCoordinatorAccess(auth.session.userId, id, body.active === true),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorAccessChangeFailed"),
    });
  }
}
