import { fetchEmailCenterOptions } from "@/lib/api/email-center";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET() {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchEmailCenterOptions(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("emailsLoadFailed"),
    });
  }
}
