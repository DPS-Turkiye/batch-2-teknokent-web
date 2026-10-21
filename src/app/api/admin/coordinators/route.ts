import { addCoordinator } from "@/lib/api/admin-coordinators";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const body = await request.json();
    return backendResponse(
      await addCoordinator(auth.session.userId, {
        fullName: String(body.fullName ?? ""),
        email: String(body.email ?? ""),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorAddFailed"),
    });
  }
}
