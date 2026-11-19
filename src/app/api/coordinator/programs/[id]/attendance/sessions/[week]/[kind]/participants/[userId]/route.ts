import {
  markSessionAttendance,
  unmarkSessionAttendance,
} from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readAttendanceParticipant } from "@/lib/server/attendance-schemas";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = {
  params: Promise<{ id: string; week: string; kind: string; userId: string }>;
};

/** A coordinator marks a participant present at a session by hand. */
export async function PUT(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, ...segments } = await params;
    const target = await readAttendanceParticipant(segments);
    if (!target.ok) return target.response;
    const { userId, ...session } = target.data;
    return backendResponse(
      await markSessionAttendance(auth.session.userId, id, session, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceMarkFailed"),
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, ...segments } = await params;
    const target = await readAttendanceParticipant(segments);
    if (!target.ok) return target.response;
    const { userId, ...session } = target.data;
    return backendResponse(
      await unmarkSessionAttendance(auth.session.userId, id, session, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceMarkFailed"),
    });
  }
}
