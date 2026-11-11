import { fetchProgramReport } from "@/lib/api/program-report";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchProgramReport(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programReportLoadFailed"),
    });
  }
}
