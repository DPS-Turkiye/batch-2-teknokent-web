import { fetchAdminAcademics } from "@/lib/api/admin-academics";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchAdminAcademics(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("academicsLoadFailed"),
    });
  }
}
