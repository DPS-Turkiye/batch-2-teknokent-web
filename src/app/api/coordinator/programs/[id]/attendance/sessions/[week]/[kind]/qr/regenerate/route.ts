import { regenerateSessionQr } from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readAttendanceSession } from "@/lib/server/attendance-schemas";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; week: string; kind: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, ...segments } = await params;
    const session = await readAttendanceSession(segments);
    if (!session.ok) return session.response;
    return backendResponse(
      await regenerateSessionQr(auth.session.userId, id, session.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceQrFailed"),
    });
  }
}
